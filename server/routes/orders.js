import express from 'express';
import pool from '../db.js';

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
        SELECT oi.*, oio.option_id, p.code as product_code
        FROM order_items oi
        LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
        LEFT JOIN products p ON oi.product_id = p.id
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
        if (item.option_id) {
          itemsMap.get(item.id).selectedOptions.push(item.option_id);
        }
      });

      order.items = Array.from(itemsMap.values());

      // Format customer, delivery, payment
      order.customer = {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email
      };

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

      // Remove old fields
      delete order.customer_name;
      delete order.customer_phone;
      delete order.customer_email;
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
      
      // Use order_number as id for frontend compatibility
      order.id = order.order_number;
      delete order.order_number;
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Get order by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.execute(`
      SELECT * FROM orders WHERE id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get items
    const [items] = await pool.execute(`
      SELECT oi.*, oio.option_id 
      FROM order_items oi
      LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `, [id]);

    const itemsMap = new Map();
    items.forEach(item => {
      if (!itemsMap.has(item.id)) {
        itemsMap.set(item.id, {
          productId: item.product_code || item.product_id, // Use code if available from JOIN
          quantity: item.quantity,
          selectedOptions: []
        });
      }
      if (item.option_id) {
        itemsMap.get(item.id).selectedOptions.push(item.option_id);
      }
    });

    order.items = Array.from(itemsMap.values());
    order.customer = {
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email
    };
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

    delete order.customer_name;
    delete order.customer_phone;
    delete order.customer_email;
    delete order.delivery_method;
    delete order.delivery_city;
    delete order.delivery_warehouse;
    delete order.delivery_post_index;
    delete order.delivery_address;
    delete order.payment_method;

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
router.post('/', async (req, res, next) => {
  try {
    const {
      id, customer, delivery, payment, items, subtotal, discount, deliveryCost, total
    } = req.body;

    // Validate required fields
    if (!id || !customer?.name || !customer?.phone || !delivery?.method || !payment?.method || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Helper function to convert undefined/empty to null
      const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;
      
      // Insert order - id is AUTO_INCREMENT, use order_number for string identifier
      // customer_email can be NULL, but provide empty string if needed
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (order_number, customer_name, customer_phone, customer_email,
          delivery_method, delivery_city, delivery_warehouse, delivery_post_index, delivery_address,
          payment_method, subtotal, discount, delivery_cost, total, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created')
      `, [
        id, // order_number (VARCHAR)
        customer.name || null, 
        customer.phone || null, 
        toNull(customer.email),
        delivery.method || null, 
        toNull(delivery.city), 
        toNull(delivery.warehouse),
        toNull(delivery.postIndex), 
        toNull(delivery.address),
        payment.method || null, 
        Number(subtotal) || 0, 
        Number(discount) || 0, 
        Number(deliveryCost) || 0, 
        Number(total) || 0
      ]);

      const orderId = orderResult.insertId; // Get the AUTO_INCREMENT id (INT)

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
        `, [orderId, productIdInt, item.quantity, itemPrice]);

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
      res.status(201).json({ id: id, message: 'Order created' });
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
    const { status } = req.body;

    // id is order_number (VARCHAR), not INT id
    await pool.execute(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `, [status, id]);

    res.json({ id, status, message: 'Order status updated' });
  } catch (error) {
    next(error);
  }
});

// Update order
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customer, delivery, payment, status, subtotal, discount, deliveryCost, total } = req.body;

    // Helper function to convert undefined/empty to null
    const toNull = (val) => (val === undefined || val === null || val === '') ? null : val;

    // id is order_number (VARCHAR), not INT id
    await pool.execute(`
      UPDATE orders SET
        customer_name = ?, customer_phone = ?, customer_email = ?,
        delivery_method = ?, delivery_city = ?, delivery_warehouse = ?,
        delivery_post_index = ?, delivery_address = ?,
        payment_method = ?, status = ?, subtotal = ?, discount = ?,
        delivery_cost = ?, total = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `, [
      customer.name, customer.phone, toNull(customer.email),
      delivery.method, toNull(delivery.city), toNull(delivery.warehouse),
      toNull(delivery.postIndex), toNull(delivery.address),
      payment.method, status, subtotal, discount, deliveryCost, total, id
    ]);

    res.json({ id, message: 'Order updated' });
  } catch (error) {
    next(error);
  }
});

export default router;

