import pool from '../db.js';

async function migrate() {
  try {
    await pool.execute(`
      ALTER TABLE products
        ADD COLUMN full_name VARCHAR(255) DEFAULT NULL AFTER name
    `);
    console.log('Migration applied: added full_name to products');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists, skipping.');
    } else {
      console.error('Migration error:', err.message);
      process.exit(1);
    }
  }
  process.exit(0);
}

migrate();
