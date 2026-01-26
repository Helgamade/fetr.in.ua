const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  try {
    // Читаем .env файл
    const envPath = path.join(__dirname, '..', '.env');
    const env = fs.readFileSync(envPath, 'utf8');
    
    const dbNameMatch = env.match(/DB_NAME=(.+)/);
    const dbPassMatch = env.match(/DB_PASSWORD=(.+)/);
    
    if (!dbNameMatch || !dbPassMatch) {
      throw new Error('DB_NAME or DB_PASSWORD not found in .env');
    }
    
    const dbName = dbNameMatch[1].trim();
    const dbPass = dbPassMatch[1].trim();
    
    // Читаем SQL файл миграции
    const sqlPath = path.join(__dirname, '..', '..', 'database', 'add_customer_first_last_name.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Подключаемся к базе данных
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: dbPass,
      database: dbName,
      multipleStatements: true
    });
    
    console.log('Running migration: add_customer_first_last_name.sql');
    
    // Выполняем SQL
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
})();
