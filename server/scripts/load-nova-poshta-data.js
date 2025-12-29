import pool from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env находится в папке server/, на два уровня выше от scripts/
dotenv.config({ path: join(__dirname, '..', '.env') });

const NOVA_POSHTA_API_URL = 'https://api.novaposhta.ua/v2.0/json/';
const API_KEY = process.env.NOVA_POSHTA_API_KEY;

if (!API_KEY) {
  console.error('❌ NOVA_POSHTA_API_KEY не установлен в .env файле');
  process.exit(1);
}

// Популярные города для быстрого выбора
const POPULAR_CITIES = [
  'Київ',
  'Одеса',
  'Дніпро',
  'Харків',
  'Львів',
  'Запоріжжя',
  'Вінниця',
  'Полтава',
  'Чернівці',
  'Миколаїв'
];

// Функция для запроса к API Новой Почты
async function novaPoshtaRequest(modelName, calledMethod, methodProperties = {}) {
  const response = await fetch(NOVA_POSHTA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: API_KEY,
      modelName,
      calledMethod,
      methodProperties,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`API error: ${data.errors?.join(', ') || 'Unknown error'}`);
  }

  return data.data;
}

// Загрузка городов
async function loadCities() {
  console.log('📥 Загрузка городов...');
  
  try {
    const cities = await novaPoshtaRequest('Address', 'getCities', {});
    
    if (!cities || cities.length === 0) {
      console.log('⚠️  Города не получены');
      return;
    }

    console.log(`✅ Получено ${cities.length} городов`);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Очистка таблицы
      await connection.execute('DELETE FROM nova_poshta_cities');
      console.log('🗑️  Старые данные удалены');

      // Определение популярных городов
      const popularCityNames = new Set(POPULAR_CITIES.map(c => c.toLowerCase()));

      let inserted = 0;
      let popularCount = 0;

      for (const city of cities) {
        const isPopular = popularCityNames.has(city.Description?.toLowerCase());
        const sortOrder = isPopular ? POPULAR_CITIES.indexOf(
          POPULAR_CITIES.find(c => c.toLowerCase() === city.Description?.toLowerCase())
        ) : 0;

        await connection.execute(`
          INSERT INTO nova_poshta_cities (
            ref, description_ua, description_ru,
            area_ref, area_description_ua, area_description_ru,
            settlement_type_ref, settlement_type_description_ua, settlement_type_description_ru,
            is_popular, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          city.Ref || null,
          city.Description || null,
          city.DescriptionRu || null,
          city.Area || null,
          city.AreaDescription || null,
          city.AreaDescriptionRu || null,
          city.SettlementType || null,
          city.SettlementTypeDescription || null,
          city.SettlementTypeDescriptionRu || null,
          isPopular,
          sortOrder
        ]);

        inserted++;
        if (isPopular) popularCount++;
      }

      await connection.commit();
      console.log(`✅ Загружено ${inserted} городов (${popularCount} популярных)`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Ошибка при загрузке городов:', error);
    throw error;
  }
}

// Загрузка отделений для всех городов
async function loadWarehouses() {
  console.log('📥 Загрузка отделений...');
  
  try {
    const connection = await pool.getConnection();
    
    // Получаем все города
    const [cities] = await connection.execute('SELECT ref, description_ua FROM nova_poshta_cities');
    
    if (cities.length === 0) {
      console.log('⚠️  Нет городов в базе. Сначала загрузите города.');
      connection.release();
      return;
    }

    console.log(`📋 Найдено ${cities.length} городов для загрузки отделений`);

    await connection.beginTransaction();

    try {
      // Очистка таблицы
      await connection.execute('DELETE FROM nova_poshta_warehouses');
      console.log('🗑️  Старые данные отделений удалены');

      let totalInserted = 0;
      let processed = 0;

      for (const city of cities) {
        try {
          // Загружаем отделения для города
          const warehouses = await novaPoshtaRequest('Address', 'getWarehouses', {
            CityRef: city.ref
          });

          if (warehouses && warehouses.length > 0) {
            for (const warehouse of warehouses) {
              // Извлекаем номер отделения из описания (например, "№2: вул. Богатирська, 11")
              let number = null;
              const numberMatch = warehouse.Description?.match(/№(\d+)/);
              if (numberMatch) {
                number = numberMatch[1];
              }

              await connection.execute(`
                INSERT INTO nova_poshta_warehouses (
                  ref, site_key, description_ua, description_ru,
                  short_address_ua, short_address_ru,
                  city_ref, city_description_ua, city_description_ru,
                  type_of_warehouse, number, phone, max_weight_allowed,
                  longitude, latitude
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                warehouse.Ref || null,
                warehouse.SiteKey || null,
                warehouse.Description || null,
                warehouse.DescriptionRu || null,
                warehouse.ShortAddress || null,
                warehouse.ShortAddressRu || null,
                city.ref,
                city.description_ua,
                null, // city_description_ru можно добавить позже
                warehouse.TypeOfWarehouse || 'PostOffice',
                number,
                warehouse.Phone || null,
                warehouse.TotalMaxWeightAllowed ? parseFloat(warehouse.TotalMaxWeightAllowed) : null,
                warehouse.Longitude ? parseFloat(warehouse.Longitude) : null,
                warehouse.Latitude ? parseFloat(warehouse.Latitude) : null
              ]);

              totalInserted++;
            }
          }

          processed++;
          if (processed % 50 === 0) {
            console.log(`⏳ Обработано ${processed}/${cities.length} городов, загружено ${totalInserted} отделений...`);
          }

          // Небольшая задержка, чтобы не перегружать API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`⚠️  Ошибка при загрузке отделений для города ${city.description_ua}:`, error.message);
          // Продолжаем обработку других городов
        }
      }

      await connection.commit();
      console.log(`✅ Загружено ${totalInserted} отделений для ${processed} городов`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Ошибка при загрузке отделений:', error);
    throw error;
  }
}

// Главная функция
async function main() {
  console.log('🚀 Начало загрузки справочников Новой Почты\n');

  try {
    // Сначала загружаем города
    await loadCities();
    console.log('');

    // Затем загружаем отделения
    await loadWarehouses();
    console.log('');

    console.log('✅ Загрузка завершена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

main();

