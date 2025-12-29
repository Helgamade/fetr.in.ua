import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function analyzeTypes() {
  try {
    console.log('🔍 Анализ типов отделений Новой Почты:\n');

    // Получаем все уникальные типы с примерами
    const [types] = await pool.execute(`
      SELECT 
        type_of_warehouse,
        COUNT(*) as total,
        MIN(description_ua) as example_description
      FROM nova_poshta_warehouses
      GROUP BY type_of_warehouse
      ORDER BY total DESC
    `);

    console.log('Все типы отделений в базе:');
    console.log('='.repeat(80));
    
    for (const type of types) {
      console.log(`\nUUID: ${type.type_of_warehouse}`);
      console.log(`Количество: ${type.total}`);
      console.log(`Пример: ${type.example_description}`);
      
      // Определяем тип по описанию
      const desc = type.example_description.toLowerCase();
      let category = 'Неизвестно';
      
      if (desc.includes('поштомат') || desc.includes('postomat')) {
        category = '📦 ПОШТОМАТ';
      } else if (desc.includes('відділення') || desc.includes('пункт') || desc.includes('postoffice')) {
        category = '🏢 ВІДДІЛЕННЯ';
      }
      
      console.log(`Категория: ${category}`);
    }

    // Проверяем для Киева
    console.log('\n\n' + '='.repeat(80));
    console.log('Анализ для Киева:');
    console.log('='.repeat(80));
    
    const [kyiv] = await pool.execute(
      'SELECT ref FROM nova_poshta_cities WHERE description_ua LIKE "Київ%" LIMIT 1'
    );
    
    if (kyiv.length > 0) {
      const [kyivTypes] = await pool.execute(`
        SELECT 
          type_of_warehouse,
          COUNT(*) as total,
          MIN(description_ua) as example_description
        FROM nova_poshta_warehouses
        WHERE city_ref = ?
        GROUP BY type_of_warehouse
        ORDER BY total DESC
      `, [kyiv[0].ref]);

      for (const type of kyivTypes) {
        const desc = type.example_description.toLowerCase();
        let category = 'Неизвестно';
        
        if (desc.includes('поштомат') || desc.includes('postomat')) {
          category = '📦 ПОШТОМАТ';
        } else if (desc.includes('відділення') || desc.includes('пункт') || desc.includes('postoffice')) {
          category = '🏢 ВІДДІЛЕННЯ';
        }
        
        console.log(`\n${category}: ${type.type_of_warehouse} (${type.total} шт.)`);
        console.log(`  Пример: ${type.example_description}`);
      }
    }

    // Группируем по категориям
    console.log('\n\n' + '='.repeat(80));
    console.log('Группировка по категориям:');
    console.log('='.repeat(80));
    
    const postomatUUIDs = [];
    const postOfficeUUIDs = [];
    
    for (const type of types) {
      const desc = type.example_description.toLowerCase();
      if (desc.includes('поштомат') || desc.includes('postomat')) {
        postomatUUIDs.push(type.type_of_warehouse);
      } else {
        postOfficeUUIDs.push(type.type_of_warehouse);
      }
    }
    
    console.log('\n📦 UUID почтоматов (Postomat):');
    postomatUUIDs.forEach(uuid => console.log(`  '${uuid}',`));
    
    console.log('\n🏢 UUID отделений (PostOffice):');
    postOfficeUUIDs.forEach(uuid => console.log(`  '${uuid}',`));

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

analyzeTypes();

