import pool from './db.js';

async function runMigration() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful!');

    // Выполняем миграцию напрямую
    console.log('🔄 Adding delivery_ttn column to orders table...');
    
    try {
      // Добавляем колонку
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN delivery_ttn VARCHAR(50) NULL AFTER tracking_token
      `);
      console.log('✅ Column delivery_ttn added successfully!');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Column already exists, skipping...');
      } else {
        throw error;
      }
    }

    try {
      // Создаем индекс
      console.log('🔄 Creating index for delivery_ttn...');
      await connection.execute(`
        CREATE INDEX idx_delivery_ttn ON orders(delivery_ttn)
      `);
      console.log('✅ Index created successfully!');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Index already exists, skipping...');
      } else {
        throw error;
      }
    }

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
    process.exit(1);
  }
}

runMigration();
