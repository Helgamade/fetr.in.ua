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

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Получаем заказ из БД
    const [orders] = await pool.execute(
      `SELECT * FROM orders WHERE order_number = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    const orderIdInt = order.id;

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

    const paymentData = buildWayForPayData(orderData, WFP_CONFIG);

    res.json({
      paymentUrl: 'https://secure.wayforpay.com/pay',
      paymentData,
    });
  } catch (error) {
    next(error);
  }
});

// Callback от WayForPay (обработка результата платежа)
router.post('/callback', async (req, res, next) => {
  try {
    const callbackData = req.body;

    // Валидируем подпись
    const isValid = validateWayForPaySignature(
      callbackData,
      WFP_CONFIG.merchantSecretKey,
      callbackData.merchantSignature
    );

    if (!isValid) {
      console.error('Invalid WayForPay signature:', callbackData);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const orderReference = callbackData.orderReference;
    const transactionStatus = callbackData.transactionStatus;
    const reasonCode = callbackData.reasonCode;
    const reason = callbackData.reason || '';

    // Обновляем статус заказа
    let orderStatus = 'created';
    if (transactionStatus === 'Approved') {
      orderStatus = 'paid';
    } else if (transactionStatus === 'Declined' || transactionStatus === 'Expired') {
      orderStatus = 'awaiting_payment';
    }

    // Обновляем заказ в БД
    await pool.execute(
      `UPDATE orders 
       SET status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE order_number = ?`,
      [orderStatus, orderReference]
    );

    // WayForPay ожидает ответ в формате JSON
    res.json({
      orderReference,
      status: 'accept',
      time: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error('WayForPay callback error:', error);
    next(error);
  }
});

export default router;

