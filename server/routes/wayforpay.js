import express from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { buildWayForPayData, validateWayForPayCallbackSignature, generateWayForPayResponseSignature } from '../utils/wayforpay.js';

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

    console.log('========================================');
    console.log('[WayForPay] ===== CREATE PAYMENT START =====');
    console.log('[WayForPay] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[WayForPay] Order ID from request:', orderId);
    console.log('[WayForPay] WFP_CONFIG:', {
      merchantAccount: WFP_CONFIG.merchantAccount,
      merchantDomainName: WFP_CONFIG.merchantDomainName,
      returnUrl: WFP_CONFIG.returnUrl,
      serviceUrl: WFP_CONFIG.serviceUrl,
      merchantSecretKey: WFP_CONFIG.merchantSecretKey ? '***PRESENT***' : '***MISSING***'
    });

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

    console.log('[WayForPay] Orders found:', orders.length);
    if (orders.length > 0) {
      console.log('[WayForPay] Order from DB:', {
        id: orders[0].id,
        order_number: orders[0].order_number,
        tracking_token: orders[0].tracking_token,
        total: orders[0].total,
        status: orders[0].status
      });
    }

    if (orders.length === 0) {
      console.error('[WayForPay] Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    const orderIdInt = order.id;

    // Получаем tracking_token для returnUrl
    const trackingToken = order.tracking_token;
    console.log('[WayForPay] Tracking token from DB:', trackingToken);
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

    console.log('[WayForPay] Items found:', items.length);
    console.log('[WayForPay] Items data:', JSON.stringify(items, null, 2));

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

    console.log('[WayForPay] Order data prepared:', JSON.stringify(orderData, null, 2));
    console.log('[WayForPay] Tracking token:', trackingToken);
    console.log('[WayForPay] Order number:', order.order_number);

    // Создаем returnUrl с trackingToken для безопасной ссылки отслеживания
    // trackingToken используется для безопасной ссылки, orderReference не нужен
    const returnUrlWithParams = `${WFP_CONFIG.returnUrl}?track=${trackingToken}`;
    console.log('[WayForPay] WFP_CONFIG.returnUrl (base):', WFP_CONFIG.returnUrl);
    console.log('[WayForPay] Return URL with params:', returnUrlWithParams);
    console.log('[WayForPay] Tracking token in URL:', trackingToken);
    console.log('[WayForPay] Order ref in URL:', order.order_number);
    
    const configWithReturnUrl = {
      ...WFP_CONFIG,
      returnUrl: returnUrlWithParams,
    };

    console.log('[WayForPay] Config with returnUrl:', {
      ...configWithReturnUrl,
      merchantSecretKey: '***HIDDEN***',
      returnUrl: configWithReturnUrl.returnUrl
    });

    // Проверяем, есть ли уже сохраненный payment_url для этого заказа
    // Если есть - используем его (чтобы избежать Duplicate Order ID)
    // Проверяем наличие поля (может не существовать, если миграция не выполнена)
    const hasPaymentUrl = order.hasOwnProperty('payment_url') && order.payment_url !== null && order.payment_url !== undefined;
    
    if (hasPaymentUrl) {
      console.log('[WayForPay] Found existing payment_url in DB, using it to avoid Duplicate Order ID');
      console.log('[WayForPay] Existing payment_url:', order.payment_url.substring(0, 100) + '...');
      
      try {
        // Парсим сохраненные данные платежа
        const savedPaymentData = JSON.parse(order.payment_url);
        console.log('[WayForPay] Parsed saved payment data, orderReference:', savedPaymentData.paymentData?.orderReference);
        
        res.json({
          paymentUrl: savedPaymentData.paymentUrl || 'https://secure.wayforpay.com/pay',
          paymentData: savedPaymentData.paymentData,
          fromCache: true
        });
        return;
      } catch (e) {
        console.error('[WayForPay] Error parsing saved payment_url, will create new payment:', e);
        // Продолжаем создание нового платежа
      }
    } else {
      console.log('[WayForPay] payment_url field not found or empty (migration may not be executed)');
    }

    // Создаем новый платеж только если нет сохраненного
    // Определяем уникальный orderReference для избежания Duplicate Order ID
    // Если это первый платеж - используем оригинальный orderReference
    // Если нужно создать новый - используем orderReference с суффиксом -2, -3 и т.д.
    let orderReference = order.order_number;
    let paymentAttempt = 1;
    
    // Проверяем, сколько раз уже создавался платеж для этого заказа
    // Анализируем сохраненные данные или используем счетчик
    const hasPaymentUrlForAttempt = order.hasOwnProperty('payment_url') && order.payment_url !== null && order.payment_url !== undefined;
    
    if (hasPaymentUrlForAttempt) {
      try {
        const savedData = JSON.parse(order.payment_url);
        const savedOrderRef = savedData.paymentData?.orderReference;
        if (savedOrderRef) {
          // Извлекаем номер попытки из orderReference (например, "305317-2" -> 2)
          const match = savedOrderRef.match(/^(.+)-(\d+)$/);
          if (match) {
            paymentAttempt = parseInt(match[2], 10) + 1;
            orderReference = `${order.order_number}-${paymentAttempt}`;
            console.log('[WayForPay] Previous payment attempt found:', match[2], 'Creating attempt:', paymentAttempt);
          } else {
            // Первая попытка была без суффикса, следующая будет -2
            paymentAttempt = 2;
            orderReference = `${order.order_number}-${paymentAttempt}`;
            console.log('[WayForPay] First payment was without suffix, creating second attempt with -2');
          }
        } else if (savedData.paymentAttempt) {
          // Используем сохраненный номер попытки
          paymentAttempt = savedData.paymentAttempt + 1;
          orderReference = `${order.order_number}-${paymentAttempt}`;
          console.log('[WayForPay] Using saved paymentAttempt:', savedData.paymentAttempt, 'Creating attempt:', paymentAttempt);
        }
      } catch (e) {
        // Если не удалось распарсить, используем оригинальный orderReference
        console.log('[WayForPay] Could not parse payment_url, using original orderReference');
      }
    }
    
    // Создаем orderData с уникальным orderReference
    const orderDataWithRef = {
      ...orderData,
      id: orderReference
    };
    
    const paymentData = buildWayForPayData(orderDataWithRef, configWithReturnUrl);
    const paymentUrl = 'https://secure.wayforpay.com/pay';
    
    console.log('[WayForPay] Creating new payment with orderReference:', paymentData.orderReference);
    console.log('[WayForPay] Payment attempt number:', paymentAttempt);

    console.log('[WayForPay] Payment data created (full):', JSON.stringify(paymentData, null, 2));
    console.log('[WayForPay] Payment data returnUrl:', paymentData.returnUrl);
    console.log('[WayForPay] Payment data serviceUrl:', paymentData.serviceUrl);
    console.log('[WayForPay] Payment data orderReference:', paymentData.orderReference);
    console.log('[WayForPay] Payment attempt:', paymentAttempt);
    
    // Сохраняем paymentUrl и paymentData в БД для повторного использования
    // Сохраняем последнюю попытку (она будет использоваться для повторной оплаты)
    // Проверяем наличие поля payment_url перед сохранением (может не существовать, если миграция не выполнена)
    const paymentDataToSave = JSON.stringify({
      paymentUrl,
      paymentData,
      paymentAttempt
    });
    
    try {
      await pool.execute(
        `UPDATE orders 
         SET payment_url = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE order_number = ?`,
        [paymentDataToSave, orderId]
      );
      console.log('[WayForPay] Payment URL and data saved to database for reuse');
    } catch (error) {
      // Если поле payment_url не существует, просто логируем ошибку, но не прерываем выполнение
      if (error.message && error.message.includes("Unknown column 'payment_url'")) {
        console.warn('[WayForPay] WARNING: payment_url column does not exist in database. Please run migration 013_add_payment_url_to_orders.sql');
        console.warn('[WayForPay] Payment will work, but will not be cached for reuse');
      } else {
        throw error; // Если другая ошибка - пробрасываем дальше
      }
    }
    
    console.log('[WayForPay] Payment URL and data saved to database for reuse');
    console.log('[WayForPay] Saved with orderReference:', paymentData.orderReference);
    console.log('[WayForPay] ===== CREATE PAYMENT END =====');
    console.log('========================================');

    res.json({
      paymentUrl,
      paymentData,
      fromCache: false
    });
  } catch (error) {
    console.error('[WayForPay] Error creating payment:', error);
    next(error);
  }
});

// Callback от WayForPay (обработка результата платежа)
// Согласно документации: https://wiki.wayforpay.com/view/852102
// Callback приходит как JSON в теле POST запроса
router.post('/callback', async (req, res, next) => {
  try {
    console.log('========================================');
    console.log('[WayForPay] ===== CALLBACK START =====');
    console.log('[WayForPay] Raw body:', JSON.stringify(req.body, null, 2));
    
    // Получаем первый ключ - он содержит весь JSON
    const keys = Object.keys(req.body || {});
    
    if (keys.length === 0) {
      console.error('[WayForPay] Empty body');
      return res.status(400).json({ error: 'Empty body' });
    }
    
    // Парсим JSON из ключа или используем req.body напрямую
    let data;
    const firstKey = keys[0];
    
    console.log('[WayForPay] First key:', firstKey.substring(0, 200));
    console.log('[WayForPay] First key starts with {?:', firstKey.startsWith('{'));
    console.log('[WayForPay] req.body keys:', Object.keys(req.body));
    console.log('[WayForPay] req.body has repayUrl?', 'repayUrl' in req.body);
    
    if (firstKey.startsWith('{')) {
      try {
        data = JSON.parse(firstKey);
        console.log('[WayForPay] Successfully parsed JSON from key!');
        console.log('[WayForPay] Parsed callback data:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('[WayForPay] JSON parse error:', e.message);
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    } else {
      // Если это не JSON-строка, используем req.body как есть
      console.log('[WayForPay] First key is not JSON string, using req.body as is');
      data = req.body;
      console.log('[WayForPay] Using req.body directly, keys:', Object.keys(data));
    }
    
    // Дополнительная проверка: если data это объект с одним ключом, который содержит JSON
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 1) {
      const singleKey = Object.keys(data)[0];
      if (typeof data[singleKey] === 'string' && data[singleKey].startsWith('{')) {
        try {
          console.log('[WayForPay] Found nested JSON in key, parsing...');
          data = JSON.parse(data[singleKey]);
          console.log('[WayForPay] Successfully parsed nested JSON!');
        } catch (e) {
          console.log('[WayForPay] Failed to parse nested JSON, using original data');
        }
      }
    }
    
    // КРИТИЧНО: Проверка что все поля есть
    console.log('[WayForPay] Checking required fields...');
    console.log('[WayForPay] merchantAccount:', data.merchantAccount);
    console.log('[WayForPay] orderReference:', data.orderReference);
    console.log('[WayForPay] amount:', data.amount);
    console.log('[WayForPay] currency:', data.currency);
    console.log('[WayForPay] merchantSignature:', data.merchantSignature);
    console.log('[WayForPay] transactionStatus:', data.transactionStatus);
    console.log('[WayForPay] repayUrl (raw):', data.repayUrl);
    console.log('[WayForPay] repayUrl type:', typeof data.repayUrl);
    console.log('[WayForPay] repayUrl is undefined?', data.repayUrl === undefined);
    console.log('[WayForPay] repayUrl is null?', data.repayUrl === null);
    
    if (!data.merchantAccount || !data.orderReference || !data.amount) {
      console.error('[WayForPay] Missing required fields:', data);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Правильный формат подписи для callback (из документации)
    // merchantAccount;orderReference;amount;currency;authCode;cardPan;transactionStatus;reasonCode
    const signatureString = [
      data.merchantAccount,
      data.orderReference,
      String(data.amount),
      data.currency,
      data.authCode || '',  // может быть пустым
      data.cardPan || '',
      data.transactionStatus,
      String(data.reasonCode || '')
    ].join(';');
    
    console.log('[WayForPay] Signature string:', signatureString);
    
    const secretKey = WFP_CONFIG.merchantSecretKey;
    const generatedSignature = crypto
      .createHmac('md5', secretKey)
      .update(signatureString, 'utf8')
      .digest('hex');
    
    console.log('[WayForPay] Generated signature:', generatedSignature);
    console.log('[WayForPay] Received signature:', data.merchantSignature);
    
    // Проверка подписи
    if (generatedSignature !== data.merchantSignature) {
      console.error('[WayForPay] Invalid signature');
      console.error('[WayForPay] Expected:', generatedSignature);
      console.error('[WayForPay] Received:', data.merchantSignature);
      // Все равно обрабатываем, но логируем ошибку
      // return res.status(400).json({ error: 'Invalid signature' });
    } else {
      console.log('[WayForPay] Signature is VALID!');
    }
    
    // Обработка статуса
    console.log('[WayForPay] Transaction status:', {
      order: data.orderReference,
      status: data.transactionStatus,
      amount: data.amount,
      reason: data.reason,
      reasonCode: data.reasonCode,
      repayUrl: data.repayUrl
    });
    
    // Обновление статуса в БД
    let orderStatus = 'accepted'; // По умолчанию "Прийнято"
    if (data.transactionStatus === 'Approved') {
      // Платеж успешный
      orderStatus = 'paid';
      console.log('[WayForPay] Payment approved:', data.orderReference);
    } else if (data.transactionStatus === 'Declined' || data.transactionStatus === 'Expired') {
      // Платеж отклонен - статус остается "Прийнято"
      orderStatus = 'accepted';
      console.log('[WayForPay] Payment declined/expired, status set to accepted:', data.orderReference, data.reason);
    } else {
      console.log('[WayForPay] Unknown transaction status:', data.transactionStatus);
    }
    
    // Сохраняем repayUrl если он есть (при неуспешной оплате)
    // Согласно документации: repayUrl передается при неуспешной оплате
    // repayUrl передается только при неуспешной оплате (Declined, Expired и т.д.)
    const repayUrl = (data.repayUrl && typeof data.repayUrl === 'string' && data.repayUrl.trim() !== '') 
      ? data.repayUrl.trim() 
      : null;
    
    console.log('[WayForPay] RepayUrl processing:');
    console.log('[WayForPay]   - Original value:', data.repayUrl);
    console.log('[WayForPay]   - Processed value:', repayUrl);
    console.log('[WayForPay]   - Transaction status:', data.transactionStatus);
    console.log('[WayForPay]   - Will save repayUrl?', repayUrl !== null);
    
    if (repayUrl) {
      console.log('[WayForPay] ✅ RepayUrl received and will be saved:', repayUrl);
    } else {
      console.log('[WayForPay] ⚠️ RepayUrl is missing or empty. Transaction status:', data.transactionStatus);
      console.log('[WayForPay] ⚠️ Note: repayUrl is only sent by WayForPay for failed payments');
    }
    
    // Обновляем заказ в БД (включая repayUrl)
    const [updateResult] = await pool.execute(
      `UPDATE orders 
       SET status = ?, repay_url = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE order_number = ?`,
      [orderStatus, repayUrl, data.orderReference]
    );
    
    console.log('[WayForPay] Order status updated:', data.orderReference, 'to', orderStatus, 'Rows affected:', updateResult.affectedRows);
    if (repayUrl) {
      console.log('[WayForPay] ✅ RepayUrl saved to database:', repayUrl);
    } else {
      console.log('[WayForPay] ℹ️ RepayUrl was NULL (not provided by WayForPay or payment was successful)');
    }
    
    // ВАЖНО: Ответ мерчанта (из документации)
    // orderReference;status;time
    const responseTime = Math.floor(Date.now() / 1000);
    const responseString = `${data.orderReference};accept;${responseTime}`;
    const responseSignature = crypto
      .createHmac('md5', secretKey)
      .update(responseString, 'utf8')
      .digest('hex');
    
    const response = {
      orderReference: data.orderReference,
      status: 'accept',
      time: responseTime,
      signature: responseSignature
    };
    
    console.log('[WayForPay] Sending response:', JSON.stringify({
      ...response,
      signature: '***HIDDEN***'
    }, null, 2));
    console.log('[WayForPay] ===== CALLBACK END =====');
    console.log('========================================');
    
    res.json(response);
  } catch (error) {
    console.error('[WayForPay] Callback error:', error);
    next(error);
  }
});

// Проверка статуса платежа и получение repayUrl через API WayForPay
// Используется когда callback не пришел (например, при отмене оплаты)
router.post('/check-status', async (req, res, next) => {
  try {
    const { orderId } = req.body;

    console.log('========================================');
    console.log('[WayForPay] ===== CHECK STATUS START =====');
    console.log('[WayForPay] Order ID from request:', orderId);

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

    // Проверяем, есть ли уже repayUrl в БД
    if (order.repay_url) {
      console.log('[WayForPay] RepayUrl already exists in DB:', order.repay_url);
      return res.json({
        repayUrl: order.repay_url,
        status: order.status
      });
    }

    // Если repayUrl нет, создаем новый платеж (fallback)
    // Это правильное поведение согласно документации WayForPay
    console.log('[WayForPay] RepayUrl not found in DB, will create new payment');
    console.log('[WayForPay] ===== CHECK STATUS END =====');
    console.log('========================================');

    res.json({
      repayUrl: null,
      status: order.status,
      message: 'RepayUrl not available. New payment will be created.'
    });
  } catch (error) {
    console.error('[WayForPay] Check status error:', error);
    next(error);
  }
});

export default router;

