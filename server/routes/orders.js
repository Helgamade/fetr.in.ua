import express from 'express';
import pool from '../db.js';
import { getOrderNumber } from '../utils/orderUtils.js';
import { optionalAuthenticate } from '../middleware/auth.js';
import { logAdminAction } from '../middleware/adminGuard.js';

const router = express.Router();

// Get all orders
router.get('/', async (req, res, next) => {
  try {
    const [orders] = await pool.execute(`
      SELECT * FROM orders ORDER BY created_at DESC
    `);

      // Get items for each order
      for (const order of orders) {
        const orderIdInt = order.id; // Save INT id before renaming
        const [items] = await pool.execute(`
          SELECT oi.*, oio.option_id, p.code as product_code, po.code as option_code
          FROM order_items oi
          LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN product_options po ON oio.option_id = po.id
          WHERE oi.order_id = ?
          ORDER BY oi.id
        `, [orderIdInt]);

        // Group items by order_item_id and convert product_id INT to code
        const itemsMap = new Map();
        items.forEach(item => {
          if (!itemsMap.has(item.id)) {
            itemsMap.set(item.id, {
              productId: item.product_code || item.product_id, // Use code if available from JOIN
              quantity: item.quantity,
              selectedOptions: []
            });
          }
          if (item.option_code) {
            itemsMap.get(item.id).selectedOptions.push(item.option_code);
          }
        });

      order.items = Array.from(itemsMap.values());

      // Format customer, delivery, payment
      order.customer = {
        name: order.customer_name,
        phone: order.customer_phone
      };

      // Добавляем данные получателя, если они есть
      if (order.recipient_name || order.recipient_phone) {
        order.recipient = {
          name: order.recipient_name || undefined,
          phone: order.recipient_phone || undefined,
          firstName: order.recipient_first_name || undefined,
          lastName: order.recipient_last_name || undefined,
        };
      }

      order.delivery = {
        method: order.delivery_method,
        city: order.delivery_city || undefined,
        cityRef: order.delivery_city_ref || undefined,
        warehouse: order.delivery_warehouse || undefined,
        warehouseRef: order.delivery_warehouse_ref || undefined,
        postIndex: order.delivery_post_index || undefined,
        address: order.delivery_address || undefined
      };

      // Парсим payment_url если есть (проверяем наличие поля)
      let paymentUrlData = null;
      const hasPaymentUrl = order.hasOwnProperty('payment_url') && order.payment_url !== null && order.payment_url !== undefined;
      if (hasPaymentUrl) {
        try {
          paymentUrlData = JSON.parse(order.payment_url);
        } catch (e) {
          console.error('[Get Orders] Error parsing payment_url for order', order.order_number, ':', e);
        }
      }
      
      // Проверяем наличие полей payment_status и paid_amount
      const hasPaymentStatus = order.hasOwnProperty('payment_status');
      const hasPaidAmount = order.hasOwnProperty('paid_amount');
      
      order.payment = {
        method: order.payment_method,
        repayUrl: order.repay_url || undefined,
        paymentUrl: paymentUrlData?.paymentUrl || undefined,
        paymentData: paymentUrlData?.paymentData || undefined,
        ...(hasPaymentStatus && { status: order.payment_status || undefined }),
        ...(hasPaidAmount && { paidAmount: order.paid_amount !== null ? parseFloat(order.paid_amount) : null })
      };
      
      // Логирование payment данных для отладки (только для WayForPay заказов)
      if (order.payment_method === 'wayforpay') {
        console.log('[Get Orders] Order', order.order_number, '- repay_url from DB:', order.repay_url);
        console.log('[Get Orders] Order', order.order_number, '- payment_url from DB:', order.payment_url ? 'PRESENT' : 'NULL');
        console.log('[Get Orders] Order', order.order_number, '- repayUrl in response:', order.payment.repayUrl);
        console.log('[Get Orders] Order', order.order_number, '- paymentUrl in response:', order.payment.paymentUrl);
      }

      // Include comment if it exists
      if (order.comment) {
        order.comment = order.comment;
      }

      // Include promo_code if it exists
      if (order.promo_code) {
        order.promoCode = order.promo_code;
      }

      // Remove old fields
      delete order.customer_name;
      delete order.customer_phone;
      delete order.customer_email;
      delete order.recipient_name;
      delete order.recipient_phone;
      delete order.recipient_first_name;
      delete order.recipient_last_name;
      delete order.promo_code;
      delete order.delivery_method;
      delete order.delivery_city;
      delete order.delivery_city_ref;
      delete order.delivery_warehouse;
      delete order.delivery_warehouse_ref;
      delete order.delivery_post_index;
      delete order.delivery_address;
      delete order.payment_method;
      delete order.repay_url;
      delete order.payment_url;

      // Convert dates
      order.createdAt = new Date(order.created_at);
      order.updatedAt = new Date(order.updated_at);
      delete order.created_at;
      delete order.updated_at;
      
      // Use order_number as id for frontend compatibility (или просто id если order_number NULL)
      order.id = order.order_number || String(order.id);
      
      // Сохраняем user_id (может быть NULL для гостевых заказов)
      // user_id уже есть в order, просто не удаляем его
      
      // Сохраняем tracking_token для безопасной ссылки отслеживания
      if (order.tracking_token) {
        order.trackingToken = String(order.tracking_token);
      }
      delete order.tracking_token;
      
      // Сохраняем delivery_ttn для номера накладной доставки (Нова Пошта/Укрпошта)
      if (order.delivery_ttn) {
        order.deliveryTtn = String(order.delivery_ttn);
      }
      delete order.delivery_ttn;
      
      delete order.order_number;
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Get order by tracking token (публичный доступ для страницы thank-you)
router.get('/track/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const [orders] = await pool.execute(`
      SELECT * FROM orders WHERE tracking_token = ?
    `, [token]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    const orderIdInt = order.id; // INT id

    // Get items using INT id
    const [items] = await pool.execute(`
      SELECT oi.*, oio.option_id, p.code as product_code, po.code as option_code
      FROM order_items oi
      LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_options po ON oio.option_id = po.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `, [orderIdInt]);

    const itemsMap = new Map();
    items.forEach(item => {
      if (!itemsMap.has(item.id)) {
        itemsMap.set(item.id, {
          productId: item.product_code || item.product_id,
          quantity: item.quantity,
          selectedOptions: []
        });
      }
      if (item.option_code) {
        itemsMap.get(item.id).selectedOptions.push(item.option_code);
      }
    });

    order.items = Array.from(itemsMap.values());
    order.customer = {
      name: order.customer_name,
      phone: order.customer_phone
    };

    if (order.recipient_name || order.recipient_phone) {
      order.recipient = {
        name: order.recipient_name || undefined,
        phone: order.recipient_phone || undefined,
        firstName: order.recipient_first_name || undefined,
        lastName: order.recipient_last_name || undefined,
      };
    }

    order.delivery = {
      method: order.delivery_method,
      city: order.delivery_city || undefined,
      cityRef: order.delivery_city_ref || undefined,
      warehouse: order.delivery_warehouse || undefined,
      warehouseRef: order.delivery_warehouse_ref || undefined,
      postIndex: order.delivery_post_index || undefined,
      address: order.delivery_address || undefined
    };
    
    // Парсим payment_url если есть (содержит paymentUrl и paymentData)
    // Проверяем наличие поля (может не существовать, если миграция не выполнена)
    let paymentUrlData = null;
    const hasPaymentUrl = order.hasOwnProperty('payment_url') && order.payment_url !== null && order.payment_url !== undefined;
    if (hasPaymentUrl) {
      try {
        paymentUrlData = JSON.parse(order.payment_url);
        console.log('[Get Order] Parsed payment_url from DB');
      } catch (e) {
        console.error('[Get Order] Error parsing payment_url:', e);
      }
    } else {
      console.log('[Get Order] payment_url field not found (migration may not be executed)');
    }
    
    // Проверяем наличие полей payment_status и paid_amount
    const hasPaymentStatus = order.hasOwnProperty('payment_status');
    const hasPaidAmount = order.hasOwnProperty('paid_amount');
    
    order.payment = {
      method: order.payment_method,
      repayUrl: order.repay_url || undefined,
      paymentUrl: paymentUrlData?.paymentUrl || undefined,
      paymentData: paymentUrlData?.paymentData || undefined,
      ...(hasPaymentStatus && { status: order.payment_status || undefined }),
      ...(hasPaidAmount && { paidAmount: order.paid_amount !== null ? parseFloat(order.paid_amount) : null })
    };
    
    // Логирование payment данных для отладки
    console.log('[Get Order] Payment data loaded:');
    console.log('[Get Order]   - payment_method:', order.payment_method);
    console.log('[Get Order]   - repay_url from DB:', order.repay_url);
    console.log('[Get Order]   - payment_url from DB:', order.payment_url ? 'PRESENT' : 'NULL');
    console.log('[Get Order]   - payment_status from DB:', hasPaymentStatus ? order.payment_status : 'NOT FOUND');
    console.log('[Get Order]   - paid_amount from DB:', hasPaidAmount ? order.paid_amount : 'NOT FOUND');
    console.log('[Get Order]   - repayUrl in response:', order.payment.repayUrl);
    console.log('[Get Order]   - paymentUrl in response:', order.payment.paymentUrl);
    console.log('[Get Order]   - paymentData in response:', order.payment.paymentData ? 'PRESENT' : 'NULL');
    console.log('[Get Order]   - payment.status in response:', order.payment.status);
    console.log('[Get Order]   - payment.paidAmount in response:', order.payment.paidAmount);

    if (order.promo_code) {
      order.promoCode = order.promo_code;
    }

    delete order.customer_name;
    delete order.customer_phone;
    delete order.customer_email;
    delete order.recipient_name;
    delete order.recipient_phone;
    delete order.recipient_first_name;
    delete order.recipient_last_name;
    delete order.promo_code;
    delete order.delivery_method;
    delete order.delivery_city;
    delete order.delivery_city_ref;
    delete order.delivery_warehouse;
    delete order.delivery_warehouse_ref;
    delete order.delivery_post_index;
    delete order.delivery_address;
    delete order.payment_method;
    delete order.repay_url;
    delete order.payment_url; // Ensure raw field is not exposed
    if (hasPaymentStatus) delete order.payment_status;
    if (hasPaidAmount) delete order.paid_amount;

    // Сохраняем tracking_token для безопасной ссылки отслеживания
    if (order.tracking_token) {
      order.trackingToken = String(order.tracking_token);
      console.log('[Get Order] tracking_token found:', order.tracking_token, '-> trackingToken:', order.trackingToken);
    } else {
      console.log('[Get Order] WARNING: tracking_token is NULL or empty for order id:', order.id);
    }
    delete order.tracking_token;
    
    // Сохраняем delivery_ttn для номера накладной доставки (Нова Пошта/Укрпошта)
    if (order.delivery_ttn) {
      order.deliveryTtn = String(order.delivery_ttn);
    }
    delete order.delivery_ttn;

    order.createdAt = new Date(order.created_at);
    order.updatedAt = new Date(order.updated_at);
    delete order.created_at;
    delete order.updated_at;
    
    // Используем order_number как id для фронтенда (или просто id если order_number NULL)
    order.id = order.order_number || String(order.id);
    delete order.order_number;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Get order history from admin_logs (должен быть перед /:id)
router.get('/:id/history', optionalAuthenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Получаем историю из admin_logs для этого заказа
    const [history] = await pool.execute(`
      SELECT 
        al.created_at,
        al.action,
        al.old_values,
        al.new_values,
        u.name as user_name
      FROM admin_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = 'order' AND al.entity_id = ?
      ORDER BY al.created_at ASC
    `, [id]);
    
    // Форматируем историю
    const formattedHistory = history.map((log) => {
      const oldValues = log.old_values ? JSON.parse(log.old_values) : null;
      const newValues = log.new_values ? JSON.parse(log.new_values) : null;
      
      let text = '';
      
      if (log.action === 'ORDER_STATUS_CHANGED' && oldValues?.status && newValues?.status) {
        const statusMap = {
          'created': 'Замовлення оформлено',
          'accepted': 'Прийнято',
          'paid': 'Оплачено',
          'packed': 'Спаковано',
          'shipped': 'Відправлено',
          'arrived': 'Прибуло',
          'completed': 'Залишити відгук',
          // Старые статусы (для обратной совместимости)
          'processing': 'В обробці',
          'assembled': 'Зібрано',
          'in_transit': 'В дорозі',
        };
        
        text = `Статус изменен: с ${statusMap[oldValues.status] || oldValues.status} на ${statusMap[newValues.status] || newValues.status}`;
      } else {
        text = log.action;
      }
      
      return {
        date: new Date(log.created_at),
        text,
        user: log.user_name || null,
        completed: true
      };
    });
    
    res.json(formattedHistory);
  } catch (error) {
    next(error);
  }
});

// Get order by ID (может быть order_number или числовой id)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // Пробуем найти по order_number, если не найдено - по числовому id
    let [orders] = await pool.execute(`
      SELECT * FROM orders WHERE order_number = ?
    `, [id]);
    
    // Если не найдено по order_number, пробуем по числовому id
    if (orders.length === 0 && /^\d+$/.test(id)) {
      [orders] = await pool.execute(`
        SELECT * FROM orders WHERE id = ?
      `, [parseInt(id)]);
    }

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    const orderIdInt = order.id; // Save INT id before renaming

    // Получаем данные сессии аналитики, если она привязана к заказу
    let analyticsSession = null;
    if (order.analytics_session_id) {
      console.log('[Get Order] Fetching analytics session:', order.analytics_session_id);
      const [sessions] = await pool.execute(`
        SELECT 
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          referrer, landing_page, device_type, browser, os,
          screen_resolution, language, ip_address, country, city,
          pages_viewed, total_time_spent, cart_items_count
        FROM analytics_sessions
        WHERE session_id = ?
      `, [order.analytics_session_id]);
      
      console.log('[Get Order] Analytics sessions found:', sessions.length);
      if (sessions.length > 0) {
        analyticsSession = sessions[0];
        console.log('[Get Order] Analytics session data:', analyticsSession);
      } else {
        console.log('[Get Order] WARNING: Analytics session not found for session_id:', order.analytics_session_id);
      }
    } else {
      console.log('[Get Order] No analytics_session_id in order');
    }

    // Get items using INT id (order_items.order_id references orders.id INT)
    // JOIN products to get code instead of INT id
    // JOIN product_options to get option code instead of INT id
    const [items] = await pool.execute(`
      SELECT oi.*, oio.option_id, p.code as product_code, po.code as option_code
      FROM order_items oi
      LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_options po ON oio.option_id = po.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `, [orderIdInt]);

    const itemsMap = new Map();
    items.forEach(item => {
      if (!itemsMap.has(item.id)) {
        itemsMap.set(item.id, {
          productId: item.product_code || item.product_id, // Use code if available from JOIN
          quantity: item.quantity,
          selectedOptions: []
        });
      }
      if (item.option_code) {
        itemsMap.get(item.id).selectedOptions.push(item.option_code);
      }
    });

    order.items = Array.from(itemsMap.values());
    order.customer = {
      name: order.customer_name,
      phone: order.customer_phone
    };

    // Добавляем данные получателя, если они есть
    if (order.recipient_name || order.recipient_phone) {
      order.recipient = {
        name: order.recipient_name || undefined,
        phone: order.recipient_phone || undefined,
        firstName: order.recipient_first_name || undefined,
        lastName: order.recipient_last_name || undefined,
      };
    }

    order.delivery = {
      method: order.delivery_method,
      city: order.delivery_city || undefined,
      cityRef: order.delivery_city_ref || undefined,
      warehouse: order.delivery_warehouse || undefined,
      warehouseRef: order.delivery_warehouse_ref || undefined,
      postIndex: order.delivery_post_index || undefined,
      address: order.delivery_address || undefined
    };
    // Проверяем наличие полей payment_status и paid_amount
    const hasPaymentStatus = order.hasOwnProperty('payment_status');
    const hasPaidAmount = order.hasOwnProperty('paid_amount');
    
    order.payment = {
      method: order.payment_method,
      repayUrl: order.repay_url || undefined,
      ...(hasPaymentStatus && { status: order.payment_status || undefined }),
      ...(hasPaidAmount && { paidAmount: order.paid_amount !== null ? parseFloat(order.paid_amount) : null })
    };
    console.log('[Get Order] Payment method from DB:', order.payment_method, '-> Response:', order.payment.method);
    console.log('[Get Order] Payment status from DB:', hasPaymentStatus ? order.payment_status : 'NOT FOUND');
    console.log('[Get Order] Paid amount from DB:', hasPaidAmount ? order.paid_amount : 'NOT FOUND');

    // Include promo_code if it exists
    if (order.promo_code) {
      order.promoCode = order.promo_code;
    }

    // Добавляем данные сессии аналитики к заказу
    if (analyticsSession) {
      order.analytics = {
        utmSource: analyticsSession.utm_source,
        utmMedium: analyticsSession.utm_medium,
        utmCampaign: analyticsSession.utm_campaign,
        utmTerm: analyticsSession.utm_term,
        utmContent: analyticsSession.utm_content,
        referrer: analyticsSession.referrer,
        landingPage: analyticsSession.landing_page,
        deviceType: analyticsSession.device_type,
        browser: analyticsSession.browser,
        os: analyticsSession.os,
        screenResolution: analyticsSession.screen_resolution,
        language: analyticsSession.language,
        ipAddress: analyticsSession.ip_address,
        country: analyticsSession.country,
        city: analyticsSession.city,
        pagesViewed: analyticsSession.pages_viewed,
        totalTimeSpent: analyticsSession.total_time_spent,
        cartItemsCount: analyticsSession.cart_items_count,
      };
      console.log('[Get Order] Analytics data added to order:', order.analytics);
    } else {
      console.log('[Get Order] No analytics session data to add');
    }

    delete order.customer_name;
    delete order.customer_phone;
    delete order.customer_email;
    delete order.recipient_name;
    delete order.recipient_phone;
    delete order.recipient_first_name;
    delete order.recipient_last_name;
    delete order.promo_code;
    delete order.delivery_method;
    delete order.delivery_city;
    delete order.delivery_city_ref;
    delete order.delivery_warehouse;
    delete order.delivery_warehouse_ref;
    delete order.delivery_post_index;
    delete order.delivery_address;
    delete order.payment_method;
    delete order.payment_url;

    // Сохраняем tracking_token для безопасной ссылки отслеживания
    if (order.tracking_token) {
      order.trackingToken = String(order.tracking_token);
      console.log('[Get Order] tracking_token found:', order.tracking_token, '-> trackingToken:', order.trackingToken);
    } else {
      console.log('[Get Order] WARNING: tracking_token is NULL or empty for order id:', order.id);
    }
    delete order.tracking_token;
    
    // Сохраняем delivery_ttn для номера накладной доставки (Нова Пошта/Укрпошта)
    if (order.delivery_ttn) {
      order.deliveryTtn = String(order.delivery_ttn);
    }
    delete order.delivery_ttn;

    order.createdAt = new Date(order.created_at);
    order.updatedAt = new Date(order.updated_at);
    delete order.created_at;
    delete order.updated_at;
    
    // Use order_number as id for frontend compatibility
    order.id = order.order_number;
    delete order.order_number;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Create order
router.post('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      customer, delivery, payment, items, subtotal, discount, deliveryCost, total, promoCode, analyticsSessionId
    } = req.body;

    // Validate required fields (убрали проверку id - генерируется на сервере)
    if (!customer?.name || !customer?.phone || !delivery?.method || !payment?.method || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Получаем user_id если пользователь авторизован
    const userId = req.user ? req.user.id : null;
    
    // Получаем analytics_session_id из запроса (передается с фронтенда)
    const sessionId = analyticsSessionId || null;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Helper function to convert undefined/empty to null
      const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;
      
      // Determine initial order status
      // Все заказы создаются со статусом 'accepted' (Прийнято)
      const initialStatus = 'accepted';
      
      // Convert payment method: 'wayforpay' -> 'wayforpay' for database
      // Маппинг способов оплаты: 'wayforpay' -> 'wayforpay', 'nalojka' -> 'nalojka', 'fopiban' -> 'fopiban'
      const dbPaymentMethod = payment.method;
      console.log('[Create Order] Payment method:', payment.method, '-> DB:', dbPaymentMethod);
      
      // Insert order БЕЗ order_number (используем AUTO_INCREMENT id)
      const recipient = req.body.recipient || null;
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (user_id, analytics_session_id, customer_name, customer_phone, customer_email,
          recipient_name, recipient_phone, recipient_first_name, recipient_last_name,
          delivery_method, delivery_city, delivery_city_ref, delivery_warehouse, delivery_warehouse_ref, delivery_post_index, delivery_address,
          payment_method, subtotal, discount, delivery_cost, total, status, comment, promo_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, // Привязываем заказ к пользователю если он авторизован
        sessionId, // Привязываем заказ к сессии аналитики
        customer.name || null, 
        customer.phone || null,
        req.user ? req.user.email : null, // Сохраняем email если пользователь авторизован
        recipient ? (recipient.name || null) : null,
        recipient ? (recipient.phone || null) : null,
        recipient ? (recipient.firstName || null) : null,
        recipient ? (recipient.lastName || null) : null, 
        delivery.method || null, 
        toNull(delivery.city), 
        toNull(delivery.cityRef),
        toNull(delivery.warehouse),
        toNull(delivery.warehouseRef),
        toNull(delivery.postIndex), 
        toNull(delivery.address),
        dbPaymentMethod, 
        Number(subtotal) || 0, 
        Number(discount) || 0, 
        Number(deliveryCost) || 0, 
        Number(total) || 0,
        initialStatus,
        toNull(req.body.comment),
        toNull(promoCode)
      ]);

      const orderIdInt = orderResult.insertId; // Get the AUTO_INCREMENT id (INT) - начинается с 305317
      
      // Генерируем номер заказа (просто число: 305317, 305318, ...)
      const orderNumber = getOrderNumber(orderIdInt);
      
      console.log('[Create Order] Generated order number:', orderNumber);
      
      // Генерируем tracking_token (10-значный цифровой код для безопасной ссылки отслеживания)
      const trackingToken = String(Math.floor(1000000000 + Math.random() * 9000000000));
      
      // Обновляем заказ с order_number и tracking_token
      await connection.execute(`
        UPDATE orders 
        SET order_number = ?, tracking_token = ?
        WHERE id = ?
      `, [String(orderNumber), trackingToken, orderIdInt]);

      // Insert items
      for (const item of items) {
        // Get product price by code
        const [products] = await connection.execute(`
          SELECT id, sale_price, base_price FROM products WHERE code = ?
        `, [item.productId]);
        
        const product = products[0];
        if (!product) {
          throw new Error(`Product with code ${item.productId} not found`);
        }
        
        const itemPrice = product.sale_price || product.base_price || 0;
        const productIdInt = product.id; // Use INT id from products table
        
        // Уменьшаем количество на складе
        await connection.execute(`
          UPDATE products 
          SET stock = GREATEST(0, stock - ?)
          WHERE id = ?
        `, [item.quantity, productIdInt]);
        
        const [itemResult] = await connection.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [orderIdInt, productIdInt, item.quantity, itemPrice]);

        const orderItemId = itemResult.insertId;

        // Insert item options (optionId is now code, need to get INT id)
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          for (const optionCode of item.selectedOptions) {
            // Get option id by code
            const [options] = await connection.execute(`
              SELECT id FROM product_options WHERE code = ?
            `, [optionCode]);
            
            if (options.length > 0) {
              const optionIdInt = options[0].id;
              await connection.execute(`
                INSERT INTO order_item_options (order_item_id, option_id)
                VALUES (?, ?)
              `, [orderItemId, optionIdInt]);
            }
          }
        }
      }

      await connection.commit();
      
      // Отправляем email уведомления (асинхронно, не блокируем ответ)
      (async () => {
        try {
          const { sendEmail, sendEmailToAdmin } = await import('../utils/emailService.js');
          
          // Получаем данные заказа для шаблона
          const [orderData] = await pool.execute(`
            SELECT * FROM orders WHERE id = ?
          `, [orderIdInt]);
          
          if (orderData.length > 0) {
            const order = orderData[0];
            const baseUrl = process.env.CORS_ORIGIN || 'https://fetr.in.ua';
            
            // Маппинг статусов на украинский
            const statusMap = {
              'created': 'Замовлення оформлено',
              'accepted': 'Прийнято',
              'paid': 'Оплачено',
              'packed': 'Спаковано',
              'shipped': 'Відправлено',
              'arrived': 'Прибуло',
              'completed': 'Залишити відгук',
              // Старые статусы (для обратной совместимости)
              'processing': 'В обробці',
              'assembled': 'Зібрано',
              'in_transit': 'В дорозі',
            };
            
            // Маппинг способов доставки на украинский
            const deliveryMethodMap = {
              'nova_poshta': 'Нова Пошта',
              'ukrposhta': 'Укрпошта',
              'pickup': 'Самовивіз'
            };
            
            // Маппинг способов оплаты на украинский
            const paymentMethodMap = {
              'wayforpay': 'Онлайн оплата (WayForPay)',
              'nalojka': 'Накладений платіж',
              'fopiban': 'Оплата на рахунок ФОП'
            };
            
            // Данные для шаблона
            const templateData = {
              orderNumber: orderNumber,
              customerName: order.customer_name,
              customerPhone: order.customer_phone,
              customerEmail: order.customer_email || '',
              total: parseFloat(order.total).toFixed(2),
              status: statusMap[order.status] || order.status,
              deliveryMethod: deliveryMethodMap[order.delivery_method] || order.delivery_method,
              deliveryCity: order.delivery_city || '',
              deliveryWarehouse: order.delivery_warehouse || '',
              paymentMethod: paymentMethodMap[order.payment_method] || order.payment_method,
              orderLink: `${baseUrl}/admin/orders/${orderNumber}`,
              trackingLink: order.tracking_token ? `${baseUrl}/order/${order.tracking_token}` : ''
            };
            
            // Email админу о новом заказе
            await sendEmailToAdmin('order_created_admin', templateData);
            
            // Email клиенту о принятии заказа (если есть email)
            if (order.customer_email) {
              await sendEmail('order_created_customer', order.customer_email, templateData);
            }
          }
        } catch (emailError) {
          console.error('[Create Order] Помилка відправки email:', emailError);
          // Не прерываем выполнение, если email не отправился
        }
      })();
      
      res.status(201).json({ 
        message: 'Order created successfully', 
        orderId: orderNumber, // Просто число: 305317
        trackingToken: trackingToken // Цифровой токен: 1234567890
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
});

// Update order status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, statusComment } = req.body;

    // Получаем старый статус и ID для логирования и обновления счетчиков
    const [oldOrder] = await pool.execute(`
      SELECT id, status FROM orders WHERE order_number = ?
    `, [id]);
    
    const oldStatus = oldOrder.length > 0 ? oldOrder[0].status : null;
    const orderIdInt = oldOrder.length > 0 ? oldOrder[0].id : null;
    
    // id is order_number (VARCHAR), not INT id
    await pool.execute(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `, [status, id]);
    
    // Обновляем actual_purchase_count товаров при изменении статуса на/с 'completed'
    if (oldStatus !== status && orderIdInt) {
      // Получаем товары из заказа
      const [items] = await pool.execute(`
        SELECT product_id, quantity FROM order_items WHERE order_id = ?
      `, [orderIdInt]);
      
      // Если статус изменился на 'completed' - увеличиваем actual_purchase_count
      if (status === 'completed' && oldStatus !== 'completed') {
        for (const item of items) {
          await pool.execute(`
            UPDATE products 
            SET actual_purchase_count = actual_purchase_count + ?
            WHERE id = ?
          `, [item.quantity, item.product_id]);
        }
      }
      // Если статус изменился с 'completed' на другой - уменьшаем actual_purchase_count
      else if (oldStatus === 'completed' && status !== 'completed') {
        for (const item of items) {
          await pool.execute(`
            UPDATE products 
            SET actual_purchase_count = GREATEST(0, actual_purchase_count - ?)
            WHERE id = ?
          `, [item.quantity, item.product_id]);
        }
      }
    }
    
    // Логируем изменение статуса, если есть авторизованный пользователь
    if (req.user) {
      await logAdminAction(
        req.user.id,
        'ORDER_STATUS_CHANGED',
        'order',
        id,
        { status: oldStatus },
        { status },
        req
      );
    }

    // Отправляем email уведомление клиенту об изменении статуса
    (async () => {
      try {
        const { sendEmail } = await import('../utils/emailService.js');
        
        const [orderData] = await pool.execute(`
          SELECT * FROM orders WHERE order_number = ?
        `, [id]);
        
        if (orderData.length > 0 && orderData[0].customer_email) {
          const order = orderData[0];
          const baseUrl = process.env.CORS_ORIGIN || 'https://fetr.in.ua';
          
          // Статусы на украинском
          const statusMap = {
            'created': 'Замовлення оформлено',
            'accepted': 'Прийнято',
            'paid': 'Оплачено',
            'packed': 'Спаковано',
            'shipped': 'Відправлено',
            'arrived': 'Прибуло',
            'completed': 'Залишити відгук',
            // Старые статусы (для обратной совместимости)
            'processing': 'В обробці',
            'assembled': 'Зібрано',
            'in_transit': 'В дорозі',
          };
          
          const templateData = {
            orderNumber: id,
            status: statusMap[status] || status,
            statusComment: statusComment || '',
            trackingLink: order.tracking_token ? `${baseUrl}/order/${order.tracking_token}` : `${baseUrl}/order/${id}`
          };
          
          await sendEmail('order_status_changed', order.customer_email, templateData);
          
          // Если статус изменился на "paid", отправляем отдельные уведомления
          if (status === 'paid') {
            const { sendEmailToAdmin } = await import('../utils/emailService.js');
            const paidData = {
              orderNumber: id,
              customerName: order.customer_name,
              total: parseFloat(order.total).toFixed(2),
              orderLink: `${baseUrl}/admin/orders/${id}`,
              trackingLink: order.tracking_token ? `${baseUrl}/order/${order.tracking_token}` : `${baseUrl}/order/${id}`
            };
            
            await sendEmailToAdmin('order_paid_admin', paidData);
            await sendEmail('order_paid_customer', order.customer_email, paidData);
          }
        }
      } catch (emailError) {
        console.error('[Update Order Status] Помилка відправки email:', emailError);
      }
    })();

    res.json({ id, status, message: 'Order status updated' });
  } catch (error) {
    next(error);
  }
});

// Update order
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customer, delivery, payment, status, subtotal, discount, deliveryCost, total, deliveryTtn, items, recipient } = req.body;

    // Helper function to convert undefined/empty to null
    const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;
    
    // Обрабатываем deliveryTtn отдельно - если не передан или пустая строка, устанавливаем null
    // ВАЖНО: deliveryTtn - это номер накладной доставки (Нова Пошта/Укрпошта)
    // tracking_token используется ТОЛЬКО для безопасной ссылки отслеживания заказа
    const deliveryTtnValue = deliveryTtn === undefined || deliveryTtn === null || deliveryTtn === '' 
      ? null 
      : String(deliveryTtn).trim() || null;

    // Обрабатываем все поля, чтобы не было undefined
    const customerName = customer?.name || null;
    const customerPhone = customer?.phone || null;
    
    // Обрабатываем получателя
    const recipientName = recipient?.name || null;
    const recipientPhone = recipient?.phone || null;
    const recipientFirstName = recipient?.firstName || null;
    const recipientLastName = recipient?.lastName || null;
    const deliveryMethod = delivery?.method || null;
    const deliveryCity = toNull(delivery?.city);
    const deliveryCityRef = toNull(delivery?.cityRef);
    const deliveryWarehouse = toNull(delivery?.warehouse);
    const deliveryWarehouseRef = toNull(delivery?.warehouseRef);
    const deliveryPostIndex = toNull(delivery?.postIndex);
    const deliveryAddress = toNull(delivery?.address);
    const paymentMethod = payment?.method || null;
    const orderStatus = status || null;
    const orderSubtotal = subtotal !== undefined ? Number(subtotal) : null;
    const orderDiscount = discount !== undefined ? Number(discount) : null;
    const orderDeliveryCost = deliveryCost !== undefined ? Number(deliveryCost) : null;
    const orderTotal = total !== undefined ? Number(total) : null;
    
    // Обрабатываем payment_status и paid_amount
    const paymentStatus = payment?.status || null;
    const paidAmount = payment?.paidAmount !== undefined && payment?.paidAmount !== null 
      ? Number(payment.paidAmount) 
      : null;

    // Проверяем наличие полей payment_status и paid_amount
    const hasPaymentStatus = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'orders' 
       AND COLUMN_NAME = 'payment_status'`
    ).then(([rows]) => rows.length > 0).catch(() => false);

    // Получаем INT id заказа по order_number
    const [orderRows] = await pool.execute(
      'SELECT id FROM orders WHERE order_number = ?',
      [id]
    );
    
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const orderIdInt = orderRows[0].id;

    // Обновляем данные заказа
    if (hasPaymentStatus) {
      await pool.execute(`
        UPDATE orders SET
          customer_name = ?, customer_phone = ?,
          recipient_name = ?, recipient_phone = ?, recipient_first_name = ?, recipient_last_name = ?,
          delivery_method = ?, delivery_city = ?, delivery_city_ref = ?, delivery_warehouse = ?, delivery_warehouse_ref = ?,
          delivery_post_index = ?, delivery_address = ?,
          payment_method = ?, payment_status = ?, paid_amount = ?,
          status = ?, subtotal = ?, discount = ?,
          delivery_cost = ?, total = ?, delivery_ttn = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_number = ?
      `, [
        customerName, customerPhone,
        recipientName, recipientPhone, recipientFirstName, recipientLastName,
        deliveryMethod, deliveryCity, deliveryCityRef, deliveryWarehouse, deliveryWarehouseRef,
        deliveryPostIndex, deliveryAddress,
        paymentMethod, paymentStatus, paidAmount,
        orderStatus, orderSubtotal, orderDiscount,
        orderDeliveryCost, orderTotal, deliveryTtnValue, id
      ]);
      console.log('[Update Order] Updated with payment_status:', paymentStatus, 'paid_amount:', paidAmount);
    } else {
      // Если поля не существуют, обновляем только старые поля
      await pool.execute(`
        UPDATE orders SET
          customer_name = ?, customer_phone = ?,
          recipient_name = ?, recipient_phone = ?, recipient_first_name = ?, recipient_last_name = ?,
          delivery_method = ?, delivery_city = ?, delivery_city_ref = ?, delivery_warehouse = ?, delivery_warehouse_ref = ?,
          delivery_post_index = ?, delivery_address = ?,
          payment_method = ?, status = ?, subtotal = ?, discount = ?,
          delivery_cost = ?, total = ?, delivery_ttn = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_number = ?
      `, [
        customerName, customerPhone,
        recipientName, recipientPhone, recipientFirstName, recipientLastName,
        deliveryMethod, deliveryCity, deliveryCityRef, deliveryWarehouse, deliveryWarehouseRef,
        deliveryPostIndex, deliveryAddress,
        paymentMethod, orderStatus, orderSubtotal, orderDiscount,
        orderDeliveryCost, orderTotal, deliveryTtnValue, id
      ]);
      console.log('[Update Order] WARNING: payment_status column does not exist. Please run migration 014_add_payment_status_and_paid_amount.sql');
    }

    // Обновляем товары в заказе, если они переданы
    if (items && Array.isArray(items)) {
      // Удаляем старые товары
      await pool.execute('DELETE FROM order_item_options WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ?)', [orderIdInt]);
      await pool.execute('DELETE FROM order_items WHERE order_id = ?', [orderIdInt]);

      // Добавляем новые товары
      for (const item of items) {
        const product = await pool.execute('SELECT id FROM products WHERE code = ?', [item.productId]);
        if (product[0].length === 0) {
          console.warn(`[Update Order] Product with code ${item.productId} not found, skipping`);
          continue;
        }
        const productIdInt = product[0][0].id;

        // Получаем цену товара
        const [productData] = await pool.execute(
          'SELECT base_price, sale_price FROM products WHERE id = ?',
          [productIdInt]
        );
        const basePrice = productData[0]?.base_price || 0;
        const salePrice = productData[0]?.sale_price;
        const productPrice = salePrice || basePrice;

        // Вычисляем цену опций
        let optionsPrice = 0;
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          const optionCodes = item.selectedOptions;
          const [optionRows] = await pool.execute(
            `SELECT id, price FROM product_options WHERE code IN (${optionCodes.map(() => '?').join(',')})`,
            optionCodes
          );
          optionsPrice = optionRows.reduce((sum, opt) => sum + (opt.price || 0), 0);
        }

        const itemPrice = productPrice + optionsPrice;

        // Вставляем товар
        const [insertResult] = await pool.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderIdInt, productIdInt, item.quantity, itemPrice]
        );
        const orderItemId = insertResult.insertId;

        // Вставляем опции товара
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          for (const optionCode of item.selectedOptions) {
            const [optionRows] = await pool.execute(
              'SELECT id FROM product_options WHERE code = ?',
              [optionCode]
            );
            if (optionRows.length > 0) {
              await pool.execute(
                'INSERT INTO order_item_options (order_item_id, option_id) VALUES (?, ?)',
                [orderItemId, optionRows[0].id]
              );
            }
          }
        }
      }
      console.log('[Update Order] Updated items:', items.length);
    }

    res.json({ id, message: 'Order updated' });
  } catch (error) {
    next(error);
  }
});

export default router;

