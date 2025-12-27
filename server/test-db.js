import pool from './db.js';

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful!');
    
    // Test query
    const [rows] = await connection.execute('SELECT DATABASE() as db');
    console.log('✅ Connected to database:', rows[0].db);
    
    // Test tables
    const [tables] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    console.log('✅ Tables count:', tables[0].count);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

testConnection();

