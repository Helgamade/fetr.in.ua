import pool from './db.js';

async function checkData() {
  try {
    const connection = await pool.getConnection();
    
    // Check products
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log('📦 Products:', products[0].count);
    
    // Check orders
    const [orders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    console.log('📋 Orders:', orders[0].count);
    
    // Check settings
    const [settings] = await connection.execute('SELECT COUNT(*) as count FROM settings');
    console.log('⚙️  Settings:', settings[0].count);
    
    // Check FAQs
    const [faqs] = await connection.execute('SELECT COUNT(*) as count FROM faqs');
    console.log('❓ FAQs:', faqs[0].count);
    
    // Check reviews
    const [reviews] = await connection.execute('SELECT COUNT(*) as count FROM reviews');
    console.log('⭐ Reviews:', reviews[0].count);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();


