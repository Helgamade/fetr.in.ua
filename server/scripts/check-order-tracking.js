import pool from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkOrderTracking() {
  try {
    const orderNumber = process.argv[2] || '305317';
    
    console.log(`🔍 Checking order: ${orderNumber}`);
    
    const [orders] = await pool.execute(`
      SELECT id, order_number, tracking_token 
      FROM orders 
      WHERE order_number = ? OR id = ?
      LIMIT 1
    `, [orderNumber, parseInt(orderNumber) || 0]);
    
    if (orders.length === 0) {
      console.log('❌ Order not found');
      return;
    }
    
    const order = orders[0];
    console.log('\n📋 Order data:');
    console.log(`  - id: ${order.id}`);
    console.log(`  - order_number: ${order.order_number || 'NULL'}`);
    console.log(`  - tracking_token: ${order.tracking_token || 'NULL'}`);
    
    if (!order.tracking_token) {
      console.log('\n⚠️  WARNING: tracking_token is NULL!');
      console.log('   Need to generate tracking token for this order.');
    } else {
      console.log(`\n✅ tracking_token exists: ${order.tracking_token}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrderTracking();

