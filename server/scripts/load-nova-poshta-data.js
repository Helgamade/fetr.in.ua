import pool from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Функция для отображения прогресс-бара
function showProgress(current, total, label = '', barLength = 30) {
  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  const filled = Math.round((percent / 100) * barLength);
  const empty = barLength - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const remaining = total - current;
  
  process.stdout.write(`\r${label} [${bar}] ${percent.toFixed(1)}% (${current}/${total}, осталось: ${remaining})`);
  
  if (current >= total) {
    process.stdout.write('\n');
  }
}

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

// Функция для запроса к API Новой Почты с retry и таймаутами
async function novaPoshtaRequest(modelName, calledMethod, methodProperties = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 секунд таймаут для больших ответов

      const requestBody = {
        apiKey: API_KEY,
        modelName,
        calledMethod,
        methodProperties: methodProperties || {},
      };

      // Для отладки - логируем только для getCities (большой запрос)
      if (calledMethod === 'getCities') {
        console.log(`📡 Запрос к API: ${calledMethod}, размер body: ${JSON.stringify(requestBody).length} байт`);
      }

      const response = await fetch(NOVA_POSHTA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}`);
      }

      // Читаем ответ как текст сначала, чтобы проверить размер
      const text = await response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from API');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error. Response length:', text.length);
        console.error('Response start:', text.substring(0, 500));
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
      
      if (!data.success) {
        throw new Error(`API error: ${data.errors?.join(', ') || 'Unknown error'}`);
      }

      return data.data;
    } catch (error) {
      // Проверяем, является ли ошибка сетевой (соединение разорвано, таймаут и т.д.)
      const isNetworkError = error.name === 'AbortError' || 
                            error.code === 'UND_ERR_SOCKET' ||
                            error.message?.includes('terminated') ||
                            error.message?.includes('other side closed') ||
                            error.cause?.code === 'UND_ERR_SOCKET' ||
                            error.message?.includes('fetch failed');

      if (isNetworkError && attempt < retries) {
        const delay = attempt * 3000; // Увеличиваем задержку с каждой попыткой
        console.log(`⚠️  Сетевая ошибка для ${calledMethod} (попытка ${attempt}/${retries}), повтор через ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Если это не сетевая ошибка или попытки закончились - пробрасываем ошибку
      throw error;
    }
  }
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
      const totalCities = cities.length;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
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
        showProgress(inserted, totalCities, '📥 Загрузка городов: ');
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
    await connection.beginTransaction();
    
    // Получаем все города
    const [cities] = await connection.execute('SELECT ref, description_ua FROM nova_poshta_cities ORDER BY is_popular DESC, description_ua ASC');
    
    if (cities.length === 0) {
      console.log('⚠️  Нет городов в базе. Сначала загрузите города.');
      connection.release();
      return;
    }

    console.log(`📋 Найдено ${cities.length} городов для связи с отделениями`);

    // КРИТИЧНО: Полная очистка таблицы перед загрузкой новых данных
    // Отключаем проверку внешних ключей для TRUNCATE
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE nova_poshta_warehouses');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🗑️  Старые данные отделений полностью удалены (TRUNCATE)');

    // Создаем Map для быстрого поиска городов по Ref
    const citiesMap = new Map();
    for (const city of cities) {
      citiesMap.set(city.ref, city);
    }

    console.log('📥 Загрузка всех отделений одним запросом...');
    const startTime = Date.now();
    
    let warehouses = [];
    try {
      // Загружаем ВСЕ отделения одним запросом (без CityRef)
      warehouses = await novaPoshtaRequest('Address', 'getWarehouses', {});
      
      if (!warehouses || warehouses.length === 0) {
        console.log('⚠️  Отделения не получены');
        connection.release();
        return;
      }

      console.log(`✅ Получено ${warehouses.length} отделений за ${((Date.now() - startTime) / 1000).toFixed(2)}с`);
    } catch (error) {
      console.error('❌ Ошибка при загрузке отделений:', error.message);
      connection.release();
      return;
    }

    const BATCH_SIZE = 1000; // Batch insert по 1000 записей для ускорения
    
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

    // Обрабатываем все отделения и связываем с городами
    console.log('🔄 Обработка отделений и связывание с городами...');
    const warehouseData = [];
    let processed = 0;
    let skipped = 0;

    for (const warehouse of warehouses) {
      const cityRef = warehouse.CityRef;
      const city = citiesMap.get(cityRef);
      
      if (!city) {
        skipped++;
        continue; // Пропускаем отделения без города в базе
      }

      // Извлекаем номер отделения из описания
      let number = null;
      const numberMatch = warehouse.Description?.match(/№(\d+)/);
      if (numberMatch) {
        number = numberMatch[1];
      }

      warehouseData.push([
        warehouse.Ref || null,
        warehouse.SiteKey || null,
        warehouse.Description || null,
        warehouse.DescriptionRu || null,
        warehouse.ShortAddress || null,
        warehouse.ShortAddressRu || null,
        cityRef,
        city.description_ua,
        null,
        warehouse.TypeOfWarehouse || 'PostOffice',
        number,
        warehouse.Phone || null,
        warehouse.TotalMaxWeightAllowed ? parseFloat(warehouse.TotalMaxWeightAllowed) : null,
        warehouse.Longitude ? parseFloat(warehouse.Longitude) : null,
        warehouse.Latitude ? parseFloat(warehouse.Latitude) : null
      ]);

      processed++;
      
      // Показываем прогресс каждые 1000 записей
      if (processed % 1000 === 0) {
        showProgress(processed, warehouses.length, '🔄 Обработка отделений: ');
        process.stdout.write(` | пропущено: ${skipped}\n`);
      }
    }

    console.log(`✅ Обработано ${processed} отделений, пропущено ${skipped} (без города в базе)`);

    // Вставляем данные батчами
    console.log('💾 Вставка отделений в базу данных...');
    let totalInserted = 0;
    
    for (let i = 0; i < warehouseData.length; i += BATCH_SIZE) {
      const batch = warehouseData.slice(i, i + BATCH_SIZE);
      await insertBatch(batch);
      totalInserted += batch.length;
      
      showProgress(totalInserted, warehouseData.length, '💾 Вставка отделений: ');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const minutes = Math.floor(duration / 60);
    const seconds = (duration % 60).toFixed(0);
    const timeStr = minutes > 0 ? `${minutes}м ${seconds}с` : `${seconds}с`;
    
    await connection.commit();
    
    console.log(`\n✅ Загружено ${totalInserted} отделений за ${timeStr}`);
    if (skipped > 0) {
      console.log(`⚠️  Пропущено ${skipped} отделений (город не найден в базе)`);
    }

    connection.release();
  } catch (error) {
    // Пытаемся откатить транзакцию если была начата
    try {
      const connection = await pool.getConnection();
      await connection.rollback();
      connection.release();
    } catch (rollbackError) {
      // Игнорируем ошибки rollback
    }
    console.error('❌ Ошибка при загрузке отделений:', error);
    throw error;
  }
}

// Главная функция
async function main() {
  const totalStartTime = Date.now();
  console.log('🚀 Начало загрузки справочников Новой Почты');
  console.log('📅 Рекомендуется запускать ежедневно (ночью) для актуальности данных');
  console.log('📝 Режим: полная загрузка (очистка всех данных перед загрузкой)\n');

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

