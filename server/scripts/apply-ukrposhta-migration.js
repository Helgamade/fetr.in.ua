import pool from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function applyMigration() {
  let connection;
  try {
    console.log('🔄 [Apply Migration] Starting...');
    
    const migrationSQL = readFileSync(
      join(__dirname, '..', '..', 'database', 'migrations', '001_create_ukrposhta_popular_cities.sql'),
      'utf-8'
    );
    
    connection = await pool.getConnection();
    
    // Выполняем SQL напрямую (он содержит CREATE TABLE IF NOT EXISTS)
    // Разделяем на отдельные запросы по ';'
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          console.log(`✅ [Apply Migration] Executed: ${statement.substring(0, 50)}...`);
        } catch (error) {
          // Игнорируем ошибки "table already exists" и "duplicate key"
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️ [Apply Migration] ${error.code}: ${error.message}`);
          } else {
            console.error(`❌ [Apply Migration] Error executing statement:`, error);
            throw error;
          }
        }
      }
    }
    
    // Проверяем, что таблица создана
    const [tables] = await connection.execute("SHOW TABLES LIKE 'ukrposhta_popular_cities'");
    if (tables.length > 0) {
      console.log(`✅ [Apply Migration] Table 'ukrposhta_popular_cities' exists`);
      
      // Проверяем количество записей
      const [rows] = await connection.execute("SELECT COUNT(*) as count FROM ukrposhta_popular_cities");
      console.log(`📊 [Apply Migration] Table has ${rows[0].count} rows`);
    } else {
      console.error(`❌ [Apply Migration] Table 'ukrposhta_popular_cities' was not created!`);
      throw new Error('Table was not created');
    }
    
    console.log('✅ [Apply Migration] Migration completed!');
  } catch (error) {
    console.error('❌ [Apply Migration] Fatal error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

applyMigration();
