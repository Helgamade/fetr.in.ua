const { pool } = require('../db');

async function migrate() {
  try {
    await pool.execute(`
      ALTER TABLE product_product_options
        ADD COLUMN order_count INT DEFAULT NULL,
        ADD COLUMN badge VARCHAR(100) DEFAULT NULL
    `);
    console.log('Migration applied: added order_count and badge to product_product_options');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist, skipping.');
    } else {
      console.error('Migration error:', err.message);
      process.exit(1);
    }
  }
  process.exit(0);
}

migrate();
