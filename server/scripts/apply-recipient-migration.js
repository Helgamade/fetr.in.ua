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
    console.log('🔄 [Apply Migration] Starting recipient fields migration...');
    
    const migrationSQL = readFileSync(
      join(__dirname, '..', '..', 'database', 'migrations', '003_add_recipient_fields.sql'),
      'utf-8'
    );
    
    connection = await pool.getConnection();
    
    // Разделяем SQL на отдельные запросы
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ [Apply Migration] Executed statement`);
        } catch (error) {
          // Игнорируем ошибки "duplicate column name" (колонка уже существует)
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`⚠️ [Apply Migration] Column already exists: ${error.message}`);
          } else {
            throw error;
          }
        }
      }
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

