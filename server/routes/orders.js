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
      const [items] = await pool.execute(`
        SELECT oi.*, oio.option_id 
        FROM order_items oi
        LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
        WHERE oi.order_id = ?
        ORDER BY oi.id
      `, [order.id]);

      // Group items by order_item_id
      const itemsMap = new Map();
      items.forEach(item => {
        if (!itemsMap.has(item.id)) {
          itemsMap.set(item.id, {
            productId: item.product_id,
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
          productId: item.product_id,
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

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert order
      await connection.execute(`
        INSERT INTO orders (id, customer_name, customer_phone, customer_email,
          delivery_method, delivery_city, delivery_warehouse, delivery_post_index, delivery_address,
          payment_method, subtotal, discount, delivery_cost, total, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created')
      `, [
        id, customer.name, customer.phone, customer.email,
        delivery.method, delivery.city || null, delivery.warehouse || null,
        delivery.postIndex || null, delivery.address || null,
        payment.method, subtotal, discount, deliveryCost, total
      ]);

      // Insert items
      for (const item of items) {
        // Get product price
        const [products] = await connection.execute(`
          SELECT sale_price, base_price FROM products WHERE id = ?
        `, [item.productId]);
        
        const product = products[0];
        const itemPrice = product?.sale_price || product?.base_price || 0;
        
        const [result] = await connection.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [id, item.productId, item.quantity, itemPrice]);

        const orderItemId = result.insertId;

        // Insert item options
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          for (const optionId of item.selectedOptions) {
            await connection.execute(`
              INSERT INTO order_item_options (order_item_id, option_id)
              VALUES (?, ?)
            `, [orderItemId, optionId]);
          }
        }
      }

      await connection.commit();
      res.status(201).json({ id, message: 'Order created' });
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

    await pool.execute(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
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

    await pool.execute(`
      UPDATE orders SET
        customer_name = ?, customer_phone = ?, customer_email = ?,
        delivery_method = ?, delivery_city = ?, delivery_warehouse = ?,
        delivery_post_index = ?, delivery_address = ?,
        payment_method = ?, status = ?, subtotal = ?, discount = ?,
        delivery_cost = ?, total = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      customer.name, customer.phone, customer.email,
      delivery.method, delivery.city || null, delivery.warehouse || null,
      delivery.postIndex || null, delivery.address || null,
      payment.method, status, subtotal, discount, deliveryCost, total, id
    ]);

    res.json({ id, message: 'Order updated' });
  } catch (error) {
    next(error);
  }
});

export default router;

