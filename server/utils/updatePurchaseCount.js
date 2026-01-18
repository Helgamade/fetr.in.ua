/**
 * Обновляет purchase_count для всех товаров на основе daily_sales_target
 * и текущего времени суток. Значение обновляется пропорционально времени.
 * 
 * В 00:00 сохраняется базовое значение purchase_count.
 * В течение дня purchase_count = базовое_значение + (daily_sales_target * multiplier).
 */
import pool from '../db.js';

export async function updatePurchaseCounts() {
  try {
    const now = new Date();
    const kyivNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }));
    const todayStr = kyivNow.toISOString().split('T')[0]; // YYYY-MM-DD
    const hoursSinceMidnight = kyivNow.getHours() + kyivNow.getMinutes() / 60;
    
    // Вычисляем множитель для текущего времени (0 до 1)
    let multiplier = 0;
    
    if (hoursSinceMidnight >= 0 && hoursSinceMidnight < 7) {
      // Ночь (00:00-07:00): минимальная активность (1-2% от дневной)
      multiplier = 0.01 + (hoursSinceMidnight / 7) * 0.01; // 0.01 до 0.02
    } else if (hoursSinceMidnight >= 7 && hoursSinceMidnight < 9) {
      // Утро (07:00-09:00): растущая активность (5-15%)
      multiplier = 0.05 + ((hoursSinceMidnight - 7) / 2) * 0.10; // 0.05 до 0.15
    } else if (hoursSinceMidnight >= 9 && hoursSinceMidnight < 21) {
      // День (09:00-21:00): пик активности (15-100%)
      const dayProgress = (hoursSinceMidnight - 9) / 12; // 0 до 1
      const peakOffset = Math.sin((dayProgress - 0.4) * Math.PI * 2) * 0.3 + 0.7;
      multiplier = 0.15 + dayProgress * 0.85 * peakOffset;
    } else {
      // Вечер (21:00-00:00): снижающаяся активность (15-1%)
      const eveningProgress = (hoursSinceMidnight - 21) / 3; // 0 до 1
      multiplier = 0.15 - eveningProgress * 0.14; // 0.15 до 0.01
    }
    
    // Если это начало дня (00:00-00:05), сохраняем текущее purchase_count как базовое
    const currentHour = Math.floor(hoursSinceMidnight);
    const currentMinute = Math.floor((hoursSinceMidnight - currentHour) * 60);
    
    if (currentHour === 0 && currentMinute < 5) {
      // Сохраняем базовые значения для всех товаров с daily_sales_target
      const [products] = await pool.execute(`
        SELECT id, purchase_count 
        FROM products 
        WHERE daily_sales_target IS NOT NULL AND daily_sales_target > 0
      `);
      
      for (const product of products) {
        await pool.execute(`
          INSERT INTO product_daily_base (product_id, base_date, base_purchase_count)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE base_purchase_count = ?
        `, [product.id, todayStr, product.purchase_count, product.purchase_count]);
      }
      
      console.log(`[Update Purchase Count] Saved base values for ${products.length} products at start of day`);
      return; // Не обновляем в начале дня, только сохраняем базовые значения
    }
    
    // Получаем все товары с daily_sales_target
    const [products] = await pool.execute(`
      SELECT p.id, p.daily_sales_target, COALESCE(pdb.base_purchase_count, p.purchase_count) as base_purchase_count
      FROM products p
      LEFT JOIN product_daily_base pdb ON p.id = pdb.product_id AND pdb.base_date = ?
      WHERE p.daily_sales_target IS NOT NULL AND p.daily_sales_target > 0
    `, [todayStr]);
    
    // Обновляем purchase_count для каждого товара
    for (const product of products) {
      const todayIncrement = Math.floor(product.daily_sales_target * multiplier);
      const newPurchaseCount = product.base_purchase_count + todayIncrement;
      
      // Обновляем только если новое значение больше текущего (защита от отката)
      await pool.execute(`
        UPDATE products 
        SET purchase_count = GREATEST(purchase_count, ?),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newPurchaseCount, product.id]);
    }
    
    console.log(`[Update Purchase Count] Updated ${products.length} products at ${kyivNow.toISOString()}`);
  } catch (error) {
    console.error('[Update Purchase Count] Error:', error);
    throw error;
  }
}
