import express from 'express';
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

    // Создаем конфиг с returnUrl, включающим trackingToken и orderReference
    // WayForPay может обрезать параметры, поэтому передаем и trackingToken, и orderReference
    const returnUrlWithParams = `${WFP_CONFIG.returnUrl}?track=${trackingToken}&orderRef=${order.order_number}`;
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

    const paymentData = buildWayForPayData(orderData, configWithReturnUrl);

    console.log('[WayForPay] Payment data created (full):', JSON.stringify(paymentData, null, 2));
    console.log('[WayForPay] Payment data returnUrl:', paymentData.returnUrl);
    console.log('[WayForPay] Payment data serviceUrl:', paymentData.serviceUrl);
    console.log('[WayForPay] Payment data orderReference:', paymentData.orderReference);
    console.log('[WayForPay] ===== CREATE PAYMENT END =====');
    console.log('========================================');

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
// Согласно документации: https://wiki.wayforpay.com/view/852102
// Callback приходит как JSON в теле POST запроса
router.post('/callback', async (req, res, next) => {
  try {
    console.log('========================================');
    console.log('[WayForPay] ===== CALLBACK START =====');
    console.log('[WayForPay] Request method:', req.method);
    console.log('[WayForPay] Request URL:', req.url);
    console.log('[WayForPay] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[WayForPay] Content-Type:', req.get('Content-Type'));
    console.log('[WayForPay] Raw req.body type:', typeof req.body);
    console.log('[WayForPay] Raw req.body:', JSON.stringify(req.body, null, 2));
    console.log('[WayForPay] Raw req.body keys:', req.body ? Object.keys(req.body) : 'null');
    
    let callbackData = req.body;
    
    // WayForPay отправляет данные как JSON в теле запроса
    // Но иногда может прийти как строка или в другом формате
    console.log('[WayForPay] Step 1: Checking callbackData type:', typeof callbackData);
    console.log('[WayForPay] Step 1: callbackData is null?', callbackData === null);
    console.log('[WayForPay] Step 1: callbackData value:', callbackData);
    
    if (typeof callbackData === 'string') {
      console.log('[WayForPay] Step 2: callbackData is string, attempting to parse...');
      try {
        callbackData = JSON.parse(callbackData);
        console.log('[WayForPay] Step 2: Successfully parsed JSON string from body');
        console.log('[WayForPay] Step 2: Parsed data:', JSON.stringify(callbackData, null, 2));
      } catch (parseError) {
        console.error('[WayForPay] Step 2: Failed to parse JSON string:', parseError);
        console.error('[WayForPay] Step 2: Parse error message:', parseError.message);
        console.error('[WayForPay] Step 2: Parse error stack:', parseError.stack);
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    }
    
    // Если данные пришли в нестандартном формате (JSON строка в ключе объекта)
    // WayForPay иногда отправляет данные как: { "{\"orderReference\":\"...\"}": "", "merchantSignature": "..." }
    console.log('[WayForPay] Step 3: Checking if callbackData is object...');
    console.log('[WayForPay] Step 3: callbackData type:', typeof callbackData);
    console.log('[WayForPay] Step 3: callbackData is null?', callbackData === null);
    
    if (typeof callbackData === 'object' && callbackData !== null) {
      const keys = Object.keys(callbackData);
      
      console.log('[WayForPay] Step 3: Callback keys count:', keys.length);
      console.log('[WayForPay] Step 3: Callback keys:', keys);
      console.log('[WayForPay] Step 3: Callback data type:', typeof callbackData);
      console.log('[WayForPay] Step 3: Full callback data:', JSON.stringify(callbackData, null, 2));
      
      // Ищем ключ, который содержит JSON строку (обычно это первый ключ, который выглядит как JSON)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        console.log(`[WayForPay] Step 3.${i + 1}: Processing key ${i + 1}/${keys.length}:`, key.substring(0, 200));
        console.log(`[WayForPay] Step 3.${i + 1}: Key type:`, typeof key);
        console.log(`[WayForPay] Step 3.${i + 1}: Key length:`, key.length);
        console.log(`[WayForPay] Step 3.${i + 1}: Key starts with {?:`, key.startsWith('{'));
        console.log(`[WayForPay] Step 3.${i + 1}: Key ends with }?:`, key.endsWith('}'));
        
        // Пропускаем merchantSignature, если он есть отдельно
        if (key === 'merchantSignature') {
          console.log(`[WayForPay] Step 3.${i + 1}: Skipping merchantSignature key`);
          console.log(`[WayForPay] Step 3.${i + 1}: merchantSignature value:`, callbackData[key]);
          continue;
        }
        
        // Если сам ключ - это JSON строка
        if (key.startsWith('{') && key.endsWith('}')) {
          console.log(`[WayForPay] Step 3.${i + 1}: Key looks like JSON, attempting to parse...`);
          try {
            const parsed = JSON.parse(key);
            console.log(`[WayForPay] Step 3.${i + 1}: Successfully parsed JSON from key!`);
            console.log(`[WayForPay] Step 3.${i + 1}: Parsed data:`, JSON.stringify(parsed, null, 2));
            console.log(`[WayForPay] Step 3.${i + 1}: Parsed orderReference:`, parsed.orderReference);
            console.log(`[WayForPay] Step 3.${i + 1}: Parsed transactionStatus:`, parsed.transactionStatus);
            
            // Если распарсилось успешно и содержит нужные поля - используем это
            if (parsed.orderReference || parsed.transactionStatus) {
              console.log(`[WayForPay] Step 3.${i + 1}: Parsed data contains orderReference or transactionStatus`);
              // merchantSignature должен быть ВНУТРИ распарсенного JSON, а не в исходном объекте
              console.log(`[WayForPay] Step 3.${i + 1}: merchantSignature in parsed data:`, parsed.merchantSignature);
              console.log(`[WayForPay] Step 3.${i + 1}: merchantSignature in original object:`, callbackData.merchantSignature);
              // Используем merchantSignature из распарсенного JSON (он там должен быть)
              // Если его нет в распарсенном, пробуем из исходного объекта
              if (!parsed.merchantSignature && callbackData.merchantSignature) {
                console.log(`[WayForPay] Step 3.${i + 1}: merchantSignature not in parsed, using from original:`, callbackData.merchantSignature);
                parsed.merchantSignature = callbackData.merchantSignature;
              }
              callbackData = parsed;
              console.log(`[WayForPay] Step 3.${i + 1}: Using parsed data from key`);
              console.log(`[WayForPay] Step 3.${i + 1}: Final callbackData.merchantSignature:`, callbackData.merchantSignature);
              break;
            } else {
              console.log(`[WayForPay] Step 3.${i + 1}: Parsed data does NOT contain orderReference or transactionStatus`);
            }
          } catch (parseError) {
            console.error(`[WayForPay] Step 3.${i + 1}: Failed to parse JSON from key:`, parseError.message);
            console.error(`[WayForPay] Step 3.${i + 1}: Parse error stack:`, parseError.stack);
          }
        }
        
        // Если значение - строка, которая выглядит как JSON
        const value = callbackData[key];
        console.log(`[WayForPay] Step 3.${i + 1}: Checking value for key "${key}"`);
        console.log(`[WayForPay] Step 3.${i + 1}: Value type:`, typeof value);
        console.log(`[WayForPay] Step 3.${i + 1}: Value:`, value);
        
        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          console.log(`[WayForPay] Step 3.${i + 1}: Value looks like JSON, attempting to parse...`);
          try {
            const parsed = JSON.parse(value);
            console.log(`[WayForPay] Step 3.${i + 1}: Successfully parsed JSON from value!`);
            console.log(`[WayForPay] Step 3.${i + 1}: Parsed data:`, JSON.stringify(parsed, null, 2));
            console.log(`[WayForPay] Step 3.${i + 1}: Parsed orderReference:`, parsed.orderReference);
            console.log(`[WayForPay] Step 3.${i + 1}: Parsed transactionStatus:`, parsed.transactionStatus);
            
            // Если распарсилось успешно и содержит нужные поля - используем это
            if (parsed.orderReference || parsed.transactionStatus) {
              console.log(`[WayForPay] Step 3.${i + 1}: Parsed data contains orderReference or transactionStatus`);
              // merchantSignature должен быть ВНУТРИ распарсенного JSON, а не в исходном объекте
              console.log(`[WayForPay] Step 3.${i + 1}: merchantSignature in parsed data:`, parsed.merchantSignature);
              console.log(`[WayForPay] Step 3.${i + 1}: merchantSignature in original object:`, callbackData.merchantSignature);
              // Используем merchantSignature из распарсенного JSON (он там должен быть)
              // Если его нет в распарсенном, пробуем из исходного объекта
              if (!parsed.merchantSignature && callbackData.merchantSignature) {
                console.log(`[WayForPay] Step 3.${i + 1}: merchantSignature not in parsed, using from original:`, callbackData.merchantSignature);
                parsed.merchantSignature = callbackData.merchantSignature;
              }
              callbackData = parsed;
              console.log(`[WayForPay] Step 3.${i + 1}: Using parsed data from value`);
              console.log(`[WayForPay] Step 3.${i + 1}: Final callbackData.merchantSignature:`, callbackData.merchantSignature);
              break;
            } else {
              console.log(`[WayForPay] Step 3.${i + 1}: Parsed data does NOT contain orderReference or transactionStatus`);
            }
          } catch (parseError) {
            console.error(`[WayForPay] Step 3.${i + 1}: Failed to parse JSON from value:`, parseError.message);
            console.error(`[WayForPay] Step 3.${i + 1}: Parse error stack:`, parseError.stack);
          }
        }
      }
    }
    
    console.log('[WayForPay] Step 4: Final callbackData after parsing:');
    console.log('[WayForPay] Step 4: callbackData type:', typeof callbackData);
    console.log('[WayForPay] Step 4: callbackData keys:', callbackData ? Object.keys(callbackData) : 'null');
    console.log('[WayForPay] Step 4: Full callbackData:', JSON.stringify(callbackData, null, 2));
    console.log('[WayForPay] Step 4: merchantSignature present?', callbackData?.merchantSignature ? 'YES' : 'NO');
    console.log('[WayForPay] Step 4: merchantSignature value:', callbackData?.merchantSignature || 'MISSING');

    // Проверяем наличие обязательных полей
    console.log('[WayForPay] Step 5: Validating callback data...');
    console.log('[WayForPay] Step 5: callbackData.orderReference:', callbackData.orderReference);
    console.log('[WayForPay] Step 5: callbackData.transactionStatus:', callbackData.transactionStatus);
    console.log('[WayForPay] Step 5: callbackData.merchantSignature:', callbackData.merchantSignature);
    console.log('[WayForPay] Step 5: callbackData.amount:', callbackData.amount);
    console.log('[WayForPay] Step 5: callbackData.currency:', callbackData.currency);
    console.log('[WayForPay] Step 5: callbackData.reasonCode:', callbackData.reasonCode);
    console.log('[WayForPay] Step 5: callbackData.reason:', callbackData.reason);
    console.log('[WayForPay] Step 5: All callbackData fields:', Object.keys(callbackData));
    console.log('[WayForPay] Step 5: Full callbackData object:', JSON.stringify(callbackData, null, 2));
    
    if (!callbackData.orderReference) {
      console.error('[WayForPay] Step 5: Missing orderReference in callback');
      console.error('[WayForPay] Step 5: callbackData:', JSON.stringify(callbackData, null, 2));
      return res.status(400).json({ error: 'Missing orderReference' });
    }

    // Валидируем подпись согласно документации WayForPay
    console.log('[WayForPay] Step 6: Validating signature...');
    console.log('[WayForPay] Step 6: WFP_CONFIG.merchantSecretKey present?', WFP_CONFIG.merchantSecretKey ? 'YES' : 'NO');
    console.log('[WayForPay] Step 6: callbackData.merchantSignature present?', callbackData.merchantSignature ? 'YES' : 'NO');
    console.log('[WayForPay] Step 6: callbackData.merchantSignature value:', callbackData.merchantSignature);
    
    const isValid = validateWayForPayCallbackSignature(
      callbackData,
      WFP_CONFIG.merchantSecretKey,
      callbackData.merchantSignature
    );

    console.log('[WayForPay] Step 6: Signature validation result:', isValid ? 'VALID' : 'INVALID');

    if (!isValid) {
      console.error('[WayForPay] Step 6: Invalid signature for callback:', callbackData.orderReference);
      // НЕ возвращаем ошибку, а продолжаем обработку, чтобы обновить статус
      // WayForPay может отправить callback несколько раз
      console.warn('[WayForPay] Step 6: Continuing despite invalid signature to update order status');
    }

    const orderReference = callbackData.orderReference;
    const transactionStatus = callbackData.transactionStatus;
    const reasonCode = callbackData.reasonCode;
    const reason = callbackData.reason || '';

    console.log('[WayForPay] Step 7: Processing callback for order...');
    console.log('[WayForPay] Step 7: orderReference:', orderReference);
    console.log('[WayForPay] Step 7: transactionStatus:', transactionStatus);
    console.log('[WayForPay] Step 7: reasonCode:', reasonCode);
    console.log('[WayForPay] Step 7: reason:', reason);
    console.log('[WayForPay] Step 7: amount:', callbackData.amount);
    console.log('[WayForPay] Step 7: currency:', callbackData.currency);
    console.log('[WayForPay] Step 7: email:', callbackData.email);
    console.log('[WayForPay] Step 7: phone:', callbackData.phone);
    console.log('[WayForPay] Step 7: cardPan:', callbackData.cardPan);
    console.log('[WayForPay] Step 7: cardType:', callbackData.cardType);
    console.log('[WayForPay] Step 7: paymentSystem:', callbackData.paymentSystem);

    // Обновляем статус заказа
    let orderStatus = 'created';
    console.log('[WayForPay] Step 8: Determining order status...');
    console.log('[WayForPay] Step 8: transactionStatus === "Approved"?', transactionStatus === 'Approved');
    console.log('[WayForPay] Step 8: transactionStatus === "Declined"?', transactionStatus === 'Declined');
    console.log('[WayForPay] Step 8: transactionStatus === "Expired"?', transactionStatus === 'Expired');
    
    if (transactionStatus === 'Approved') {
      orderStatus = 'paid';
      console.log('[WayForPay] Step 8: Order approved, setting status to "paid"');
      console.log('[WayForPay] Step 8: Order approved:', orderReference);
    } else if (transactionStatus === 'Declined' || transactionStatus === 'Expired') {
      orderStatus = 'awaiting_payment';
      console.log('[WayForPay] Step 8: Order declined/expired, setting status to "awaiting_payment"');
      console.log('[WayForPay] Step 8: Order declined/expired:', orderReference, 'Reason:', reason);
    } else {
      console.log('[WayForPay] Step 8: Unknown transaction status, keeping status as "created"');
      console.log('[WayForPay] Step 8: Unknown transaction status:', transactionStatus, 'for order:', orderReference);
    }

    console.log('[WayForPay] Step 8: Final orderStatus:', orderStatus);

    // Обновляем заказ в БД
    console.log('[WayForPay] Step 9: Updating order in database...');
    console.log('[WayForPay] Step 9: orderReference:', orderReference);
    console.log('[WayForPay] Step 9: orderStatus:', orderStatus);
    
    const [updateResult] = await pool.execute(
      `UPDATE orders 
       SET status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE order_number = ?`,
      [orderStatus, orderReference]
    );

    console.log('[WayForPay] Step 9: Update result:', {
      affectedRows: updateResult.affectedRows,
      insertId: updateResult.insertId,
      changedRows: updateResult.changedRows
    });
    console.log('[WayForPay] Step 9: Order status updated:', orderReference, 'to', orderStatus, 'Rows affected:', updateResult.affectedRows);

    // WayForPay ожидает ответ в формате JSON
    // Согласно документации: orderReference;status;time
    console.log('[WayForPay] Step 10: Preparing response...');
    const responseTime = Math.floor(Date.now() / 1000);
    console.log('[WayForPay] Step 10: responseTime:', responseTime);
    console.log('[WayForPay] Step 10: orderReference:', orderReference);
    console.log('[WayForPay] Step 10: status:', 'accept');
    
    const responseSignature = generateWayForPayResponseSignature(orderReference, 'accept', responseTime, WFP_CONFIG.merchantSecretKey);
    console.log('[WayForPay] Step 10: responseSignature generated:', responseSignature ? 'YES' : 'NO');
    
    const response = {
      orderReference,
      status: 'accept',
      time: responseTime,
      signature: responseSignature,
    };
    
    console.log('[WayForPay] Step 10: Response object:', JSON.stringify({
      ...response,
      signature: '***HIDDEN***'
    }, null, 2));
    console.log('[WayForPay] Step 10: Full response (with signature):', JSON.stringify(response, null, 2));
    console.log('[WayForPay] ===== CALLBACK END =====');
    console.log('========================================');
    
    res.json(response);
  } catch (error) {
    console.error('[WayForPay] Callback error:', error);
    next(error);
  }
});

export default router;

