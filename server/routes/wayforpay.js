import express from 'express';
import pool from '../db.js';
import { buildWayForPayData, validateWayForPaySignature } from '../utils/wayforpay.js';

const router = express.Router();

// WayForPay конфигурация из переменных окружения
const WFP_CONFIG = {
  merchantAccount: process.env.WAYFORPAY_MERCHANT_ACCOUNT || '',
  merchantSecretKey: process.env.WAYFORPAY_SECRET_KEY || '',
  merchantDomainName: process.env.WAYFORPAY_DOMAIN || '',
  returnUrl: process.env.WAYFORPAY_RETURN_URL || 'https://fetr.in.ua/thank-you',
  serviceUrl: process.env.WAYFORPAY_SERVICE_URL || 'https://fetr.in.ua/api/wayforpay/callback',
};

// Создание платежа WayForPay
router.post('/create-payment', async (req, res, next) => {
  try {
    const { orderId } = req.body;

    console.log('[WayForPay] Creating payment for order:', orderId);

    if (!orderId) {
      console.error('[WayForPay] Order ID is required');
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Проверяем конфигурацию
    if (!WFP_CONFIG.merchantAccount || !WFP_CONFIG.merchantSecretKey) {
      console.error('[WayForPay] Missing merchant credentials');
      return res.status(500).json({ error: 'WayForPay configuration is missing' });
    }

    // Получаем заказ из БД
    const [orders] = await pool.execute(
      `SELECT * FROM orders WHERE order_number = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      console.error('[WayForPay] Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    const orderIdInt = order.id;

    // Получаем tracking_token для returnUrl
    const trackingToken = order.tracking_token;
    if (!trackingToken) {
      console.error('[WayForPay] Tracking token not found for order:', orderId);
      return res.status(500).json({ error: 'Tracking token not found' });
    }

    // Получаем товары заказа
    const [items] = await pool.execute(`
      SELECT 
        oi.*, 
        p.code as product_code,
        p.name as product_name,
        p.base_price,
        p.sale_price
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderIdInt]);

    if (items.length === 0) {
      console.error('[WayForPay] No items found for order:', orderId);
      return res.status(400).json({ error: 'Order has no items' });
    }

    // Формируем данные для WayForPay
    const orderData = {
      id: order.order_number,
      total: parseFloat(order.total),
      items: items.map(item => ({
        productId: item.product_code,
        productName: item.product_name || 'Товар',
        quantity: item.quantity,
        price: parseFloat(item.price) || parseFloat(item.sale_price || item.base_price || 0),
      })),
    };

    console.log('[WayForPay] Order data:', JSON.stringify(orderData, null, 2));

    // Создаем конфиг с returnUrl, включающим trackingToken
    const configWithReturnUrl = {
      ...WFP_CONFIG,
      returnUrl: `${WFP_CONFIG.returnUrl}?track=${trackingToken}`,
    };

    const paymentData = buildWayForPayData(orderData, configWithReturnUrl);

    console.log('[WayForPay] Payment data created (without signature):', JSON.stringify({
      ...paymentData,
      merchantSignature: '***HIDDEN***'
    }, null, 2));

    res.json({
      paymentUrl: 'https://secure.wayforpay.com/pay',
      paymentData,
    });
  } catch (error) {
    console.error('[WayForPay] Error creating payment:', error);
    next(error);
  }
});

// Callback от WayForPay (обработка результата платежа)
router.post('/callback', async (req, res, next) => {
  try {
    const callbackData = req.body;
    
    console.log('[WayForPay] Callback received:', JSON.stringify({
      ...callbackData,
      merchantSignature: callbackData.merchantSignature ? '***PRESENT***' : '***MISSING***'
    }, null, 2));

    // Валидируем подпись
    const isValid = validateWayForPaySignature(
      callbackData,
      WFP_CONFIG.merchantSecretKey,
      callbackData.merchantSignature
    );

    if (!isValid) {
      console.error('[WayForPay] Invalid signature for callback:', callbackData.orderReference);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const orderReference = callbackData.orderReference;
    const transactionStatus = callbackData.transactionStatus;
    const reasonCode = callbackData.reasonCode;
    const reason = callbackData.reason || '';

    console.log('[WayForPay] Processing callback for order:', orderReference, 'Status:', transactionStatus);

    // Обновляем статус заказа
    let orderStatus = 'created';
    if (transactionStatus === 'Approved') {
      orderStatus = 'paid';
      console.log('[WayForPay] Order approved:', orderReference);
    } else if (transactionStatus === 'Declined' || transactionStatus === 'Expired') {
      orderStatus = 'awaiting_payment';
      console.log('[WayForPay] Order declined/expired:', orderReference, 'Reason:', reason);
    } else {
      console.log('[WayForPay] Unknown transaction status:', transactionStatus, 'for order:', orderReference);
    }

    // Обновляем заказ в БД
    const [updateResult] = await pool.execute(
      `UPDATE orders 
       SET status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE order_number = ?`,
      [orderStatus, orderReference]
    );

    console.log('[WayForPay] Order status updated:', orderReference, 'to', orderStatus, 'Rows affected:', updateResult.affectedRows);

    // WayForPay ожидает ответ в формате JSON
    const response = {
      orderReference,
      status: 'accept',
      time: Math.floor(Date.now() / 1000),
    };
    
    console.log('[WayForPay] Sending callback response:', response);
    res.json(response);
  } catch (error) {
    console.error('[WayForPay] Callback error:', error);
    next(error);
  }
});

export default router;

