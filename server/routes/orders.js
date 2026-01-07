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
        warehouse: order.delivery_warehouse || undefined,
        postIndex: order.delivery_post_index || undefined,
        address: order.delivery_address || undefined
      };

      order.payment = {
        method: order.payment_method
      };

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
      delete order.delivery_warehouse;
      delete order.delivery_post_index;
      delete order.delivery_address;
      delete order.payment_method;

      // Convert dates
      order.createdAt = new Date(order.created_at);
      order.updatedAt = new Date(order.updated_at);
      delete order.created_at;
      delete order.updated_at;
      
      // Use order_number as id for frontend compatibility (или просто id если order_number NULL)
      order.id = order.order_number || String(order.id);
      
      // Сохраняем user_id (может быть NULL для гостевых заказов)
      // user_id уже есть в order, просто не удаляем его
      
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
      warehouse: order.delivery_warehouse || undefined,
      postIndex: order.delivery_post_index || undefined,
      address: order.delivery_address || undefined
    };
    
    order.payment = {
      method: order.payment_method
    };

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
    delete order.delivery_warehouse;
    delete order.delivery_post_index;
    delete order.delivery_address;
    delete order.payment_method;

    // Сохраняем tracking_token для админки (для создания ссылки отслеживания)
    if (order.tracking_token) {
      order.trackingToken = String(order.tracking_token);
      console.log('[Get Order] tracking_token found:', order.tracking_token, '-> trackingToken:', order.trackingToken);
    } else {
      console.log('[Get Order] WARNING: tracking_token is NULL or empty for order id:', order.id);
    }
    delete order.tracking_token;

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
          'created': 'Новый',
          'accepted': 'Принят',
          'processing': 'В обработке',
          'awaiting_payment': 'Ожидает оплаты',
          'paid': 'Оплаченный',
          'assembled': 'Собран',
          'packed': 'Упакован',
          'shipped': 'Отправлен',
          'in_transit': 'В дороге',
          'arrived': 'Прибыл',
          'completed': 'Выполнен'
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
      warehouse: order.delivery_warehouse || undefined,
      postIndex: order.delivery_post_index || undefined,
      address: order.delivery_address || undefined
    };
    order.payment = {
      method: order.payment_method
    };
    console.log('[Get Order] Payment method from DB:', order.payment_method, '-> Response:', order.payment.method);

    // Include promo_code if it exists
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
    delete order.delivery_warehouse;
    delete order.delivery_post_index;
    delete order.delivery_address;
    delete order.payment_method;

    // Сохраняем tracking_token для админки (для создания ссылки отслеживания)
    if (order.tracking_token) {
      order.trackingToken = String(order.tracking_token);
      console.log('[Get Order] tracking_token found:', order.tracking_token, '-> trackingToken:', order.trackingToken);
    } else {
      console.log('[Get Order] WARNING: tracking_token is NULL or empty for order id:', order.id);
    }
    delete order.tracking_token;

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
      customer, delivery, payment, items, subtotal, discount, deliveryCost, total, promoCode
    } = req.body;

    // Validate required fields (убрали проверку id - генерируется на сервере)
    if (!customer?.name || !customer?.phone || !delivery?.method || !payment?.method || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Получаем user_id если пользователь авторизован
    const userId = req.user ? req.user.id : null;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Helper function to convert undefined/empty to null
      const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;
      
      // Determine initial order status based on payment method
      // For wayforpay payment, status is 'awaiting_payment' until WayForPay confirms payment
      // For nalojka, status is 'created'
      const initialStatus = payment.method === 'wayforpay' ? 'awaiting_payment' : 'created';
      
      // Convert payment method: 'wayforpay' -> 'wayforpay' for database
      // Маппинг способов оплаты: 'wayforpay' -> 'wayforpay', 'nalojka' -> 'nalojka', 'fopiban' -> 'fopiban'
      const dbPaymentMethod = payment.method;
      console.log('[Create Order] Payment method:', payment.method, '-> DB:', dbPaymentMethod);
      
      // Insert order БЕЗ order_number (используем AUTO_INCREMENT id)
      const recipient = req.body.recipient || null;
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (user_id, customer_name, customer_phone, customer_email,
          recipient_name, recipient_phone, recipient_first_name, recipient_last_name,
          delivery_method, delivery_city, delivery_city_ref, delivery_warehouse, delivery_warehouse_ref, delivery_post_index, delivery_address,
          payment_method, subtotal, discount, delivery_cost, total, status, comment, promo_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, // Привязываем заказ к пользователю если он авторизован
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
              'created': 'Новий',
              'accepted': 'Прийнято',
              'processing': 'В обробці',
              'awaiting_payment': 'Очікує оплату',
              'paid': 'Оплачено',
              'assembled': 'Зібрано',
              'packed': 'Запаковано',
              'shipped': 'Відправлено',
              'in_transit': 'В дорозі',
              'arrived': 'Прибуло',
              'completed': 'Виконано'
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

    // Получаем старый статус для логирования
    const [oldOrder] = await pool.execute(`
      SELECT status FROM orders WHERE order_number = ?
    `, [id]);
    
    const oldStatus = oldOrder.length > 0 ? oldOrder[0].status : null;
    
    // id is order_number (VARCHAR), not INT id
    await pool.execute(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `, [status, id]);
    
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
            'created': 'Новий',
            'accepted': 'Прийнято',
            'processing': 'В обробці',
            'awaiting_payment': 'Очікує оплату',
            'paid': 'Оплачено',
            'assembled': 'Зібрано',
            'packed': 'Запаковано',
            'shipped': 'Відправлено',
            'in_transit': 'В дорозі',
            'arrived': 'Прибуло',
            'completed': 'Виконано'
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
    const { customer, delivery, payment, status, subtotal, discount, deliveryCost, total, trackingToken } = req.body;

    // Helper function to convert undefined/empty to null
    const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;
    
    // Обрабатываем trackingToken отдельно - если не передан или пустая строка, устанавливаем null
    const trackingTokenValue = trackingToken === undefined || trackingToken === null || trackingToken === '' 
      ? null 
      : String(trackingToken).trim() || null;

    // Обрабатываем все поля, чтобы не было undefined
    const customerName = customer?.name || null;
    const customerPhone = customer?.phone || null;
    const deliveryMethod = delivery?.method || null;
    const deliveryCity = toNull(delivery?.city);
    const deliveryWarehouse = toNull(delivery?.warehouse);
    const deliveryPostIndex = toNull(delivery?.postIndex);
    const deliveryAddress = toNull(delivery?.address);
    const paymentMethod = payment?.method || null;
    const orderStatus = status || null;
    const orderSubtotal = subtotal !== undefined ? Number(subtotal) : null;
    const orderDiscount = discount !== undefined ? Number(discount) : null;
    const orderDeliveryCost = deliveryCost !== undefined ? Number(deliveryCost) : null;
    const orderTotal = total !== undefined ? Number(total) : null;

    // id is order_number (VARCHAR), not INT id
    await pool.execute(`
      UPDATE orders SET
        customer_name = ?, customer_phone = ?,
        delivery_method = ?, delivery_city = ?, delivery_warehouse = ?,
        delivery_post_index = ?, delivery_address = ?,
        payment_method = ?, status = ?, subtotal = ?, discount = ?,
        delivery_cost = ?, total = ?, tracking_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `, [
      customerName, customerPhone,
      deliveryMethod, deliveryCity, deliveryWarehouse,
      deliveryPostIndex, deliveryAddress,
      paymentMethod, orderStatus, orderSubtotal, orderDiscount,
      orderDeliveryCost, orderTotal, trackingTokenValue, id
    ]);

    res.json({ id, message: 'Order updated' });
  } catch (error) {
    next(error);
  }
});

export default router;

