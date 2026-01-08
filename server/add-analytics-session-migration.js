import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Running migration: add analytics_session_id to orders...');
    
    // Читаем SQL файл
    const sqlPath = path.join(__dirname, '..', 'database', 'add_analytics_session_to_orders.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Выполняем SQL команды по отдельности (MySQL не поддерживает IF NOT EXISTS в ALTER TABLE)
    try {
      await pool.execute(`
        ALTER TABLE orders
          ADD COLUMN analytics_session_id VARCHAR(255) NULL AFTER user_id
      `);
      console.log('✓ Added analytics_session_id column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Column analytics_session_id already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await pool.execute(`
        CREATE INDEX idx_analytics_session_id ON orders(analytics_session_id)
      `);
      console.log('✓ Created index on analytics_session_id');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Index idx_analytics_session_id already exists');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

