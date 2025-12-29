import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkTypes() {
  try {
    console.log('🔍 Проверка типов отделений:\n');

    // Все типы в базе
    const [types] = await pool.execute(
      'SELECT type_of_warehouse, COUNT(*) as cnt FROM nova_poshta_warehouses GROUP BY type_of_warehouse'
    );
    console.log('Все типы отделений в базе:');
    types.forEach(t => console.log(`  ${t.type_of_warehouse}: ${t.cnt}`));

    // Для Киева
    const [kyiv] = await pool.execute(
      'SELECT ref FROM nova_poshta_cities WHERE description_ua LIKE "Київ%" LIMIT 1'
    );
    
    if (kyiv.length > 0) {
      console.log(`\nТипы отделений для Киева (${kyiv[0].ref}):`);
      const [w] = await pool.execute(
        'SELECT type_of_warehouse, COUNT(*) as cnt FROM nova_poshta_warehouses WHERE city_ref = ? GROUP BY type_of_warehouse',
        [kyiv[0].ref]
      );
      w.forEach(t => console.log(`  ${t.type_of_warehouse}: ${t.cnt}`));

      // Проверяем запрос с PostOffice
      const [postOffice] = await pool.execute(
        'SELECT COUNT(*) as cnt FROM nova_poshta_warehouses WHERE city_ref = ? AND type_of_warehouse = ?',
        [kyiv[0].ref, 'PostOffice']
      );
      console.log(`\nОтделений типа PostOffice для Киева: ${postOffice[0].cnt}`);

      // Проверяем запрос с Postomat
      const [postomat] = await pool.execute(
        'SELECT COUNT(*) as cnt FROM nova_poshta_warehouses WHERE city_ref = ? AND type_of_warehouse = ?',
        [kyiv[0].ref, 'Postomat']
      );
      console.log(`Отделений типа Postomat для Киева: ${postomat[0].cnt}`);

      // Примеры отделений каждого типа
      const [examples] = await pool.execute(
        'SELECT type_of_warehouse, description_ua FROM nova_poshta_warehouses WHERE city_ref = ? LIMIT 10',
        [kyiv[0].ref]
      );
      console.log('\nПримеры отделений:');
      examples.forEach((e, i) => {
        console.log(`  ${i + 1}. [${e.type_of_warehouse}] ${e.description_ua}`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkTypes();

