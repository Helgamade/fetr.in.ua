import pool from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function applyPaymentMethodsMigration() {
  let connection;
  try {
    console.log('🔄 [Apply Payment Methods Migration] Starting...');
    connection = await pool.getConnection();

    // Check current ENUM values
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM orders WHERE Field = 'payment_method'
    `);
    
    console.log('📋 [Apply Payment Methods Migration] Current payment_method column:', columns[0]);

    // Update existing records first
    console.log('🔄 [Apply Payment Methods Migration] Updating existing records...');
    await connection.execute(`UPDATE orders SET payment_method = 'wayforpay' WHERE payment_method = 'card'`);
    await connection.execute(`UPDATE orders SET payment_method = 'nalojka' WHERE payment_method = 'cod'`);
    await connection.execute(`UPDATE orders SET payment_method = 'fopiban' WHERE payment_method = 'fop'`);
    console.log('✅ [Apply Payment Methods Migration] Existing records updated');

    // Apply migration
    const migrationSQL = `
      ALTER TABLE orders MODIFY COLUMN payment_method ENUM('wayforpay', 'nalojka', 'fopiban') NOT NULL;
    `;
    
    await connection.execute(migrationSQL);
    console.log('✅ [Apply Payment Methods Migration] Migration applied successfully!');

    // Verify
    const [columnsAfter] = await connection.execute(`
      SHOW COLUMNS FROM orders WHERE Field = 'payment_method'
    `);
    console.log('📋 [Apply Payment Methods Migration] Updated payment_method column:', columnsAfter[0]);

  } catch (error) {
    console.error('❌ [Apply Payment Methods Migration] Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

applyPaymentMethodsMigration();

