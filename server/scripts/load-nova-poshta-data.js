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
  const startTime = Date.now();
  console.log('📥 Загрузка городов...');
  
  try {
    const cities = await novaPoshtaRequest('Address', 'getCities', {});
    
    if (!cities || cities.length === 0) {
      console.log('⚠️  Города не получены');
      return false;
    }

    console.log(`✅ Получено ${cities.length} городов`);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // КРИТИЧНО: Полная очистка таблицы перед загрузкой новых данных
      // Сначала отключаем проверку внешних ключей, чтобы можно было использовать TRUNCATE
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      await connection.execute('TRUNCATE TABLE nova_poshta_cities');
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      console.log('🗑️  Старые данные полностью удалены (TRUNCATE)');

      // Определение популярных городов
      const popularCityNames = new Set(POPULAR_CITIES.map(c => c.toLowerCase()));

      // Batch insert для ускорения (по 1000 записей за раз)
      const BATCH_SIZE = 1000;
      const batches = [];
      
      for (let i = 0; i < cities.length; i += BATCH_SIZE) {
        batches.push(cities.slice(i, i + BATCH_SIZE));
      }

      let inserted = 0;
      let popularCount = 0;

      for (const batch of batches) {
        const values = [];
        const placeholders = [];

        for (const city of batch) {
          const isPopular = popularCityNames.has(city.Description?.toLowerCase());
          const sortOrder = isPopular ? POPULAR_CITIES.indexOf(
            POPULAR_CITIES.find(c => c.toLowerCase() === city.Description?.toLowerCase())
          ) : 0;

          values.push(
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
          );
          placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
          
          if (isPopular) popularCount++;
        }

        await connection.execute(`
          INSERT INTO nova_poshta_cities (
            ref, description_ua, description_ru,
            area_ref, area_description_ua, area_description_ru,
            settlement_type_ref, settlement_type_description_ua, settlement_type_description_ru,
            is_popular, sort_order
          ) VALUES ${placeholders.join(', ')}
        `, values);

        inserted += batch.length;
      }

      await connection.commit();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Загружено ${inserted} городов (${popularCount} популярных) за ${duration}с`);
      return true;
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
  const startTime = Date.now();
  console.log('📥 Загрузка отделений...');
  
  try {
    const connection = await pool.getConnection();
    
    // Получаем все города
    const [cities] = await connection.execute('SELECT ref, description_ua FROM nova_poshta_cities ORDER BY is_popular DESC, description_ua ASC');
    
    if (cities.length === 0) {
      console.log('⚠️  Нет городов в базе. Сначала загрузите города.');
      connection.release();
      return;
    }

    console.log(`📋 Найдено ${cities.length} городов для загрузки отделений`);

    // КРИТИЧНО: Полная очистка таблицы перед загрузкой новых данных
    // Отключаем проверку внешних ключей для TRUNCATE
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE nova_poshta_warehouses');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🗑️  Старые данные отделений полностью удалены (TRUNCATE)');

    let totalInserted = 0;
    let processed = 0;
    let failedCities = 0;
    let rateLimitCount = 0;
    const MAX_RETRIES = 2; // Уменьшили до 2 попыток
    const BASE_DELAY = 200; // Уменьшили базовую задержку до 200ms
    const RATE_LIMIT_DELAY = 3000; // Уменьшили задержку при rate limit до 3 секунд
    const BATCH_SIZE = 20; // Batch insert по 20 записей (15 полей * 20 = 300 placeholders, безопасно)
    const warehouseBatch = []; // Накопление записей для batch insert
    
    // Функция для вставки батча
    const insertBatch = async (batch) => {
      if (batch.length === 0) return;
      
      // Если батч слишком большой, разбиваем на меньшие части
      if (batch.length > BATCH_SIZE) {
        for (let i = 0; i < batch.length; i += BATCH_SIZE) {
          const chunk = batch.slice(i, i + BATCH_SIZE);
          await insertBatch(chunk);
        }
        return;
      }
      
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = batch.flat();

      await connection.execute(`
        INSERT INTO nova_poshta_warehouses (
          ref, site_key, description_ua, description_ru,
          short_address_ua, short_address_ru,
          city_ref, city_description_ua, city_description_ru,
          type_of_warehouse, number, phone, max_weight_allowed,
          longitude, latitude
        ) VALUES ${placeholders}
      `, values);
    };

    for (const city of cities) {
      let retries = 0;
      let success = false;
      const cityWarehouses = [];

      while (retries < MAX_RETRIES && !success) {
        try {
          // Загружаем отделения для города
          const warehouses = await novaPoshtaRequest('Address', 'getWarehouses', {
            CityRef: city.ref
          });

          if (warehouses && warehouses.length > 0) {
            for (const warehouse of warehouses) {
              // Извлекаем номер отделения из описания
              let number = null;
              const numberMatch = warehouse.Description?.match(/№(\d+)/);
              if (numberMatch) {
                number = numberMatch[1];
              }

              cityWarehouses.push([
                warehouse.Ref || null,
                warehouse.SiteKey || null,
                warehouse.Description || null,
                warehouse.DescriptionRu || null,
                warehouse.ShortAddress || null,
                warehouse.ShortAddressRu || null,
                city.ref,
                city.description_ua,
                null,
                warehouse.TypeOfWarehouse || 'PostOffice',
                number,
                warehouse.Phone || null,
                warehouse.TotalMaxWeightAllowed ? parseFloat(warehouse.TotalMaxWeightAllowed) : null,
                warehouse.Longitude ? parseFloat(warehouse.Longitude) : null,
                warehouse.Latitude ? parseFloat(warehouse.Latitude) : null
              ]);
            }
          }

          success = true;

        } catch (error) {
          // Проверяем, является ли ошибка rate limit
          const isRateLimit = error.message && (
            error.message.includes('To many requests') ||
            error.message.includes('Too many requests') ||
            error.message.includes('rate limit') ||
            error.message.includes('429')
          );

          if (isRateLimit && retries < MAX_RETRIES) {
            retries++;
            rateLimitCount++;
            const delay = RATE_LIMIT_DELAY + (rateLimitCount * 1000); // Увеличиваем задержку при частых rate limit
            if (retries === 1) {
              console.log(`⏸️  Rate limit для города ${city.description_ua}. Ожидание ${delay}ms...`);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // Если не rate limit или превышены попытки - пропускаем город
            if (retries === 0) {
              console.error(`⚠️  Ошибка для города ${city.description_ua}:`, error.message);
            }
            failedCities++;
            success = true; // Пропускаем город и продолжаем
          }
        }
      }

      // Добавляем отделения в batch для вставки
      if (cityWarehouses.length > 0) {
        warehouseBatch.push(...cityWarehouses);
        totalInserted += cityWarehouses.length;

        // Вставляем batch когда накопилось достаточно записей
        if (warehouseBatch.length >= BATCH_SIZE) {
          await insertBatch(warehouseBatch);
          warehouseBatch.length = 0; // Очищаем batch
        }
      }

      processed++;
      
      // Адаптивная задержка: увеличиваем при частых rate limit
      const delay = rateLimitCount > 20 ? BASE_DELAY * 2 : BASE_DELAY;
      
      if (processed % 100 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        const rate = (processed / ((Date.now() - startTime) / 1000)).toFixed(1);
        console.log(`⏳ Обработано ${processed}/${cities.length} городов (${rate} гор/с), загружено ${totalInserted} отделений, ошибок: ${failedCities}...`);
      }

      // Задержка между запросами
      if (processed < cities.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Вставляем оставшиеся данные из batch
    if (warehouseBatch.length > 0) {
      await insertBatch(warehouseBatch);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Загружено ${totalInserted} отделений для ${processed} городов за ${duration}с`);
    if (failedCities > 0) {
      console.log(`⚠️  Не удалось загрузить отделения для ${failedCities} городов`);
    }

    connection.release();
  } catch (error) {
    console.error('❌ Ошибка при загрузке отделений:', error);
    throw error;
  }
}

// Главная функция
async function main() {
  const totalStartTime = Date.now();
  console.log('🚀 Начало загрузки справочников Новой Почты');
  console.log('📅 Рекомендуется запускать ежедневно (ночью) для актуальности данных\n');

  try {
    // Сначала загружаем города
    const citiesLoaded = await loadCities();
    console.log('');

    if (citiesLoaded) {
      // Затем загружаем отделения
      await loadWarehouses();
      console.log('');
    }

    const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
    console.log(`✅ Загрузка завершена успешно за ${totalDuration}с`);
    console.log('💡 Для автоматического ежедневного обновления настройте cron:');
    console.log('   0 3 * * * cd /home/idesig02/fetr.in.ua/www && node server/scripts/load-nova-poshta-data.js');
    process.exit(0);
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

main();

