import pool from '../db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function applyOrderTrackingMigration() {
  let connection;
  try {
    console.log('🔄 [Apply Order Tracking Migration] Starting...');
    connection = await pool.getConnection();

    // Проверяем текущую структуру таблицы
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM orders
    `);
    
    console.log('📋 [Apply Order Tracking Migration] Current orders table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Проверяем, есть ли уже поля
    const hasOrderNumber = columns.some(col => col.Field === 'order_number');
    const hasTrackingToken = columns.some(col => col.Field === 'tracking_token');
    const idIsInt = columns.find(col => col.Field === 'id')?.Type.includes('int');

    console.log(`\n📊 [Apply Order Tracking Migration] Status:`);
    console.log(`  - order_number: ${hasOrderNumber ? '✅ exists' : '❌ missing'}`);
    console.log(`  - tracking_token: ${hasTrackingToken ? '✅ exists' : '❌ missing'}`);
    console.log(`  - id is INT: ${idIsInt ? '✅ yes' : '❌ no'}`);

    // Добавляем поля если их нет
    if (!hasOrderNumber) {
      console.log('\n➕ [Apply Order Tracking Migration] Adding order_number column...');
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN order_number VARCHAR(20) NULL AFTER id
      `);
      console.log('✅ [Apply Order Tracking Migration] order_number column added');
    }

    if (!hasTrackingToken) {
      console.log('\n➕ [Apply Order Tracking Migration] Adding tracking_token column...');
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN tracking_token VARCHAR(15) NULL AFTER order_number
      `);
      console.log('✅ [Apply Order Tracking Migration] tracking_token column added');
    }

    // Создаем индексы
    try {
      console.log('\n📑 [Apply Order Tracking Migration] Creating indexes...');
      await connection.execute(`
        CREATE UNIQUE INDEX idx_order_number ON orders(order_number)
      `);
      console.log('✅ [Apply Order Tracking Migration] idx_order_number created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️ [Apply Order Tracking Migration] idx_order_number already exists');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`
        CREATE UNIQUE INDEX idx_tracking_token ON orders(tracking_token)
      `);
      console.log('✅ [Apply Order Tracking Migration] idx_tracking_token created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️ [Apply Order Tracking Migration] idx_tracking_token already exists');
      } else {
        throw error;
      }
    }

    // Если id не INT, нужно переделать структуру (это сложная операция)
    if (!idIsInt) {
      console.log('\n⚠️ [Apply Order Tracking Migration] WARNING: id is not INT AUTO_INCREMENT');
      console.log('   This migration assumes id will be changed to INT AUTO_INCREMENT manually');
      console.log('   Or you need to update the schema.sql file');
    } else {
      // Проверяем AUTO_INCREMENT значение
      const [autoIncrement] = await connection.execute(`
        SELECT AUTO_INCREMENT 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'orders'
      `);
      
      const currentAutoIncrement = autoIncrement[0]?.AUTO_INCREMENT;
      console.log(`\n📊 [Apply Order Tracking Migration] Current AUTO_INCREMENT: ${currentAutoIncrement}`);
      
      if (!currentAutoIncrement || currentAutoIncrement < 305317) {
        console.log('\n🔧 [Apply Order Tracking Migration] Setting AUTO_INCREMENT to 305317...');
        await connection.execute(`
          ALTER TABLE orders AUTO_INCREMENT = 305317
        `);
        console.log('✅ [Apply Order Tracking Migration] AUTO_INCREMENT set to 305317');
      } else {
        console.log(`✅ [Apply Order Tracking Migration] AUTO_INCREMENT is already >= 305317 (${currentAutoIncrement})`);
      }
    }

    // Генерируем order_number и tracking_token для существующих заказов без них
    console.log('\n🔄 [Apply Order Tracking Migration] Updating existing orders...');
    const [existingOrders] = await connection.execute(`
      SELECT id FROM orders 
      WHERE order_number IS NULL OR tracking_token IS NULL
    `);
    
    if (existingOrders.length > 0) {
      console.log(`📋 [Apply Order Tracking Migration] Found ${existingOrders.length} orders to update`);
      
      const { generateTrackingToken, getOrderNumber } = await import('../utils/orderUtils.js');
      
      for (const order of existingOrders) {
        const orderNumber = getOrderNumber(order.id);
        const trackingToken = generateTrackingToken(orderNumber);
        
        await connection.execute(`
          UPDATE orders 
          SET order_number = ?, tracking_token = ?
          WHERE id = ?
        `, [String(orderNumber), trackingToken, order.id]);
        
        console.log(`✅ [Apply Order Tracking Migration] Updated order id=${order.id}: number=${orderNumber}, token=${trackingToken}`);
      }
    } else {
      console.log('✅ [Apply Order Tracking Migration] All orders already have order_number and tracking_token');
    }

    console.log('\n✅ [Apply Order Tracking Migration] Migration completed successfully!');
  } catch (error) {
    console.error('❌ [Apply Order Tracking Migration] Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

applyOrderTrackingMigration();

