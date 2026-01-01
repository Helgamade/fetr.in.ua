import pool from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function createTable() {
  let connection;
  try {
    console.log('🔄 [Create Table] Starting...');
    
    connection = await pool.getConnection();
    
    // Создаем таблицу
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ukrposhta_popular_cities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        city_id VARCHAR(50) NULL,
        postal_code VARCHAR(20) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        last_updated_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_city_id (city_id),
        INDEX idx_sort_order (sort_order),
        UNIQUE KEY unique_name_region (name, region)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ [Create Table] Table created');
    
    // Вставляем начальные данные
    await connection.execute(`
      INSERT INTO ukrposhta_popular_cities (name, region, sort_order) VALUES
      ('Київ', 'Київська', 1),
      ('Одеса', 'Одеська', 2),
      ('Дніпро', 'Дніпропетровська', 3),
      ('Харків', 'Харківська', 4),
      ('Львів', 'Львівська', 5),
      ('Запоріжжя', 'Запорізька', 6)
      ON DUPLICATE KEY UPDATE name=name
    `);
    console.log('✅ [Create Table] Initial data inserted');
    
    // Проверяем
    const [rows] = await connection.execute("SELECT COUNT(*) as count FROM ukrposhta_popular_cities");
    console.log(`📊 [Create Table] Table has ${rows[0].count} rows`);
    
    console.log('✅ [Create Table] Completed!');
  } catch (error) {
    console.error('❌ [Create Table] Fatal error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

createTable();

