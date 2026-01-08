import pool from '../db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful!');

    // Выполняем миграцию напрямую
    console.log('🔄 Adding delivery_ttn column to orders table...');
    
    // Добавляем колонку
    await connection.execute(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS delivery_ttn VARCHAR(50) NULL AFTER tracking_token
    `);
    console.log('✅ Column delivery_ttn added successfully!');

    // Создаем индекс
    console.log('🔄 Creating index for delivery_ttn...');
    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_delivery_ttn ON orders(delivery_ttn)
    `);
    console.log('✅ Index created successfully!');

    // Проверяем, что колонка существует
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'delivery_ttn'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('Column info:', columns[0]);
    } else {
      console.log('❌ Column not found after migration!');
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column already exists, skipping...');
      process.exit(0);
    }
    process.exit(1);
  }
}

runMigration();
