import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем переменные окружения
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testConnections() {
  console.log('🧪 Тестирование связей между городами и отделениями Новой Почты\n');

  try {
    // 1. Проверяем общее количество городов и отделений
    console.log('📊 Общая статистика:');
    const [cityStats] = await pool.execute('SELECT COUNT(*) as total FROM nova_poshta_cities');
    const [warehouseStats] = await pool.execute('SELECT COUNT(*) as total FROM nova_poshta_warehouses');
    console.log(`  Городов: ${cityStats[0].total}`);
    console.log(`  Отделений: ${warehouseStats[0].total}\n`);

    // 2. Проверяем популярные города
    console.log('🏙️  Популярные города:');
    const [popularCities] = await pool.execute(`
      SELECT ref, description_ua, is_popular 
      FROM nova_poshta_cities 
      WHERE is_popular = TRUE 
      ORDER BY sort_order ASC 
      LIMIT 10
    `);
    
    for (const city of popularCities) {
      const [warehouseCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM nova_poshta_warehouses WHERE city_ref = ?',
        [city.ref]
      );
      console.log(`  ${city.description_ua} (${city.ref}): ${warehouseCount[0].total} отделений`);
    }
    console.log('');

    // 3. Проверяем Киев (должен быть популярным)
    console.log('🔍 Детальная проверка Киева:');
    const [kyiv] = await pool.execute(
      'SELECT ref, description_ua FROM nova_poshta_cities WHERE description_ua LIKE "Київ%" LIMIT 1'
    );
    
    if (kyiv.length > 0) {
      const city = kyiv[0];
      console.log(`  Найден город: ${city.description_ua} (${city.ref})`);
      
      // Проверяем отделения
      const [warehouses] = await pool.execute(
        'SELECT ref, description_ua, type_of_warehouse, city_ref FROM nova_poshta_warehouses WHERE city_ref = ? LIMIT 5',
        [city.ref]
      );
      
      console.log(`  Найдено отделений: ${warehouses.length}`);
      if (warehouses.length > 0) {
        console.log('  Примеры отделений:');
        warehouses.forEach((w, i) => {
          console.log(`    ${i + 1}. ${w.description_ua} (${w.type_of_warehouse}) - city_ref: ${w.city_ref}`);
        });
      } else {
        console.log('  ⚠️  Отделения не найдены!');
        
        // Проверяем, есть ли отделения с похожим city_ref
        const [similar] = await pool.execute(
          'SELECT DISTINCT city_ref, COUNT(*) as cnt FROM nova_poshta_warehouses GROUP BY city_ref LIMIT 5'
        );
        console.log('  Примеры city_ref из отделений:');
        similar.forEach(s => {
          console.log(`    ${s.city_ref}: ${s.cnt} отделений`);
        });
      }
    } else {
      console.log('  ❌ Киев не найден в базе!');
    }
    console.log('');

    // 4. Проверяем связи (отделения без города)
    console.log('🔗 Проверка связей:');
    const [orphanWarehouses] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM nova_poshta_warehouses w
      LEFT JOIN nova_poshta_cities c ON w.city_ref = c.ref
      WHERE c.ref IS NULL
    `);
    console.log(`  Отделений без города: ${orphanWarehouses[0].total}`);

    // 5. Проверяем города без отделений
    const [citiesWithoutWarehouses] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM nova_poshta_cities c
      LEFT JOIN nova_poshta_warehouses w ON c.ref = w.city_ref
      WHERE w.ref IS NULL
    `);
    console.log(`  Городов без отделений: ${citiesWithoutWarehouses[0].total}\n`);

    // 6. Тестируем запрос как в API
    console.log('🧪 Тестовый запрос API (Киев, PostOffice):');
    if (kyiv.length > 0) {
      const testQuery = `
        SELECT 
          ref,
          site_key,
          description_ua,
          description_ru,
          short_address_ua,
          short_address_ru,
          type_of_warehouse,
          number,
          phone,
          max_weight_allowed,
          city_ref
        FROM nova_poshta_warehouses
        WHERE city_ref = ? AND type_of_warehouse = ?
        ORDER BY 
          CASE 
            WHEN number IS NOT NULL AND number REGEXP '^[0-9]+$' THEN CAST(number AS UNSIGNED)
            ELSE 999999
          END ASC,
          description_ua ASC
        LIMIT 10
      `;
      
      const [testResults] = await pool.execute(testQuery, [kyiv[0].ref, 'PostOffice']);
      console.log(`  Найдено отделений: ${testResults.length}`);
      if (testResults.length > 0) {
        console.log('  Примеры результатов:');
        testResults.slice(0, 3).forEach((w, i) => {
          console.log(`    ${i + 1}. ${w.description_ua} (ref: ${w.ref}, city_ref: ${w.city_ref})`);
        });
      } else {
        console.log('  ⚠️  Результаты не найдены!');
      }
    }
    console.log('');

    // 7. Проверяем формат city_ref
    console.log('📋 Проверка формата city_ref:');
    const [cityRefs] = await pool.execute(`
      SELECT DISTINCT city_ref, COUNT(*) as cnt 
      FROM nova_poshta_warehouses 
      GROUP BY city_ref 
      LIMIT 5
    `);
    console.log('  Примеры city_ref из отделений:');
    cityRefs.forEach(c => {
      console.log(`    "${c.city_ref}" (${c.cnt} отделений)`);
    });

    const [cityRefsFromCities] = await pool.execute(`
      SELECT ref, description_ua 
      FROM nova_poshta_cities 
      LIMIT 5
    `);
    console.log('  Примеры ref из городов:');
    cityRefsFromCities.forEach(c => {
      console.log(`    "${c.ref}" - ${c.description_ua}`);
    });

    console.log('\n✅ Тестирование завершено');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testConnections();

