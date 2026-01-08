import express from 'express';
import pool from '../db.js';

const router = express.Router();

// ============================================
// PUBLIC ENDPOINTS (для отслеживания)
// ============================================

// Создать или обновить сессию
router.post('/session', async (req, res, next) => {
  try {
    const { sessionId, fingerprint } = req.body;
    
    if (!sessionId || !fingerprint) {
      return res.status(400).json({ error: 'sessionId and fingerprint are required' });
    }

    const {
      userId,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      referrer,
      landingPage,
      deviceType,
      browser,
      os,
      screenResolution,
      language,
      cartItemsCount
    } = req.body;

    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Конвертируем undefined в null для SQL
    const toNull = (val) => (val === undefined ? null : val);
    const toNullOrNumber = (val) => (val === undefined || val === null ? 0 : Number(val));

    // Проверяем существование сессии
    const [existing] = await pool.execute(
      'SELECT id FROM analytics_sessions WHERE session_id = ?',
      [sessionId]
    );

    if (existing.length > 0) {
      // Обновляем существующую сессию
      await pool.execute(`
        UPDATE analytics_sessions SET
          last_activity_at = CURRENT_TIMESTAMP,
          is_online = true,
          user_id = COALESCE(?, user_id),
          cart_items_count = COALESCE(?, cart_items_count),
          pages_viewed = pages_viewed + 1
        WHERE session_id = ?
      `, [toNull(userId), toNullOrNumber(cartItemsCount), sessionId]);
    } else {
      // Создаем новую сессию
      await pool.execute(`
        INSERT INTO analytics_sessions (
          session_id, user_id, visitor_fingerprint,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          referrer, landing_page, device_type, browser, os,
          screen_resolution, language, ip_address, cart_items_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sessionId, toNull(userId), fingerprint,
        toNull(utmSource), toNull(utmMedium), toNull(utmCampaign), toNull(utmTerm), toNull(utmContent),
        toNull(referrer), toNull(landingPage), toNull(deviceType), toNull(browser), toNull(os),
        toNull(screenResolution), toNull(language), toNull(ipAddress), toNullOrNumber(cartItemsCount)
      ]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics session error:', error);
    next(error);
  }
});

// Записать просмотр страницы
router.post('/page-view', async (req, res, next) => {
  try {
    const { sessionId, pageUrl } = req.body;
    
    if (!sessionId || !pageUrl) {
      return res.status(400).json({ error: 'sessionId and pageUrl are required' });
    }

    const {
      pageTitle,
      pageType,
      productId
    } = req.body;

    // Конвертируем undefined в null для SQL
    const toNull = (val) => (val === undefined ? null : val);

    // Вставляем новый page-view
    const [result] = await pool.execute(`
      INSERT INTO analytics_page_views (
        session_id, page_url, page_title, page_type, product_id
      ) VALUES (?, ?, ?, ?, ?)
    `, [sessionId, pageUrl, toNull(pageTitle), toNull(pageType), toNull(productId)]);

    // ОБЯЗАТЕЛЬНО обновляем сессию, чтобы last_activity_at обновился
    // и current_page был актуальным в реалтайме
    await pool.execute(`
      UPDATE analytics_sessions 
      SET 
        last_activity_at = CURRENT_TIMESTAMP,
        is_online = true
      WHERE session_id = ?
    `, [sessionId]);

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Analytics page-view error:', error);
    next(error);
  }
});

// Обновить время на странице и взаимодействие
router.patch('/page-view/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timeSpent, scrollDepth, clicksCount } = req.body;

    await pool.execute(`
      UPDATE analytics_page_views SET
        time_spent = ?,
        scroll_depth = ?,
        clicks_count = ?,
        left_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [timeSpent || 0, scrollDepth || 0, clicksCount || 0, id]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Записать событие
router.post('/event', async (req, res, next) => {
  try {
    const { sessionId, eventType } = req.body;
    
    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'sessionId and eventType are required' });
    }

    const {
      userId,
      eventCategory,
      eventLabel,
      eventData,
      productId,
      orderId,
      eventValue
    } = req.body;

    // Конвертируем undefined в null для SQL
    const toNull = (val) => (val === undefined ? null : val);
    const toNullString = (val) => (val === undefined || val === null ? null : JSON.stringify(val));

    await pool.execute(`
      INSERT INTO analytics_events (
        session_id, user_id, event_type, event_category, event_label,
        event_data, product_id, order_id, event_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionId,
      toNull(userId),
      eventType,
      toNull(eventCategory),
      toNull(eventLabel),
      toNullString(eventData),
      toNull(productId),
      toNull(orderId),
      toNull(eventValue)
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics event error:', error);
    next(error);
  }
});

// Обновить воронку продаж
router.post('/funnel', async (req, res, next) => {
  try {
    const { sessionId, stage } = req.body;
    
    if (!sessionId || !stage) {
      return res.status(400).json({ error: 'sessionId and stage are required' });
    }

    const {
      userId,
      orderId,
      cartProducts,
      cartTotal
    } = req.body;

    // Маппинг стадий на поля таблицы
    const stageFields = {
      'visited_site': 'visited_site_at',
      'viewed_product': 'viewed_product_at',
      'added_to_cart': 'added_to_cart_at',
      'started_checkout': 'started_checkout_at',
      'filled_name': 'filled_name_at',
      'filled_phone': 'filled_phone_at',
      'selected_delivery': 'selected_delivery_at',
      'filled_delivery': 'filled_delivery_at',
      'selected_payment': 'selected_payment_at',
      'clicked_submit': 'clicked_submit_at',
      'completed_order': 'completed_order_at',
      'paid_order': 'paid_order_at',
    };

    const fieldName = stageFields[stage];
    if (!fieldName) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    // Проверяем существование записи воронки
    const [existing] = await pool.execute(
      'SELECT id FROM analytics_funnel WHERE session_id = ? ORDER BY id DESC LIMIT 1',
      [sessionId]
    );

    if (existing.length > 0) {
      // Обновляем существующую запись
      const updates = [`${fieldName} = CURRENT_TIMESTAMP`];
      const values = [];
      
      if (userId) {
        updates.push('user_id = ?');
        values.push(userId);
      }
      if (orderId) {
        updates.push('order_id = ?');
        values.push(orderId);
      }
      if (cartProducts) {
        updates.push('cart_products = ?');
        values.push(JSON.stringify(cartProducts));
      }
      if (cartTotal !== undefined) {
        updates.push('cart_total = ?');
        values.push(cartTotal);
      }
      
      values.push(existing[0].id);

      await pool.execute(
        `UPDATE analytics_funnel SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    } else {
      // Создаем новую запись
      // Конвертируем undefined в null для SQL
      const toNull = (val) => (val === undefined ? null : val);
      const toNullString = (val) => (val === undefined || val === null ? null : JSON.stringify(val));

      await pool.execute(`
        INSERT INTO analytics_funnel (
          session_id, user_id, order_id, ${fieldName},
          cart_products, cart_total
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `, [
        sessionId,
        toNull(userId),
        toNull(orderId),
        toNullString(cartProducts),
        toNull(cartTotal)
      ]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics funnel error:', error);
    next(error);
  }
});

// Пометить сессию как офлайн
router.post('/session/:sessionId/offline', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    await pool.execute(
      'UPDATE analytics_sessions SET is_online = false WHERE session_id = ?',
      [sessionId]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN ENDPOINTS (требуют авторизации)
// ============================================

// Получить онлайн пользователей
router.get('/realtime', async (req, res, next) => {
  try {
    // Помечаем как офлайн тех, кто неактивен более 5 минут
    await pool.execute(`
      UPDATE analytics_sessions 
      SET is_online = false 
      WHERE is_online = true 
      AND last_activity_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    `);

    // Получаем онлайн пользователей (ИСКЛЮЧАЕМ тех, кто находится в админке)
    const [sessions] = await pool.execute(`
      SELECT 
        s.*,
        pv.page_url as current_page,
        pv.page_title as current_page_title,
        u.name as user_name,
        u.email as user_email
      FROM analytics_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN analytics_page_views pv ON pv.id = (
        SELECT id FROM analytics_page_views 
        WHERE session_id = s.session_id 
        ORDER BY entered_at DESC, id DESC LIMIT 1
      )
      WHERE s.is_online = true
        AND (pv.page_url IS NULL OR pv.page_url NOT LIKE '/admin%')
        AND (pv.page_url IS NULL OR pv.page_url != '/admin')
      ORDER BY s.last_activity_at DESC
    `);

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// Получить статистику за период
router.get('/stats', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = to || new Date().toISOString();

    // Общая статистика
    const [general] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT user_id) as total_users,
        SUM(pages_viewed) as total_page_views,
        AVG(pages_viewed) as avg_pages_per_session,
        AVG(total_time_spent) as avg_time_spent
      FROM analytics_sessions
      WHERE created_at BETWEEN ? AND ?
    `, [dateFrom, dateTo]);

    // Топ страниц
    const [topPages] = await pool.execute(`
      SELECT 
        page_url,
        page_title,
        COUNT(*) as views,
        AVG(time_spent) as avg_time_spent,
        AVG(scroll_depth) as avg_scroll_depth
      FROM analytics_page_views
      WHERE entered_at BETWEEN ? AND ?
      GROUP BY page_url, page_title
      ORDER BY views DESC
      LIMIT 10
    `, [dateFrom, dateTo]);

    // Источники трафика
    const [trafficSources] = await pool.execute(`
      SELECT 
        COALESCE(utm_source, 'direct') as source,
        COALESCE(utm_medium, '') as medium,
        COUNT(*) as sessions,
        COUNT(DISTINCT user_id) as users
      FROM analytics_sessions
      WHERE created_at BETWEEN ? AND ?
      GROUP BY utm_source, utm_medium
      ORDER BY sessions DESC
    `, [dateFrom, dateTo]);

    // Устройства
    const [devices] = await pool.execute(`
      SELECT 
        device_type,
        COUNT(*) as sessions,
        AVG(pages_viewed) as avg_pages,
        AVG(total_time_spent) as avg_time
      FROM analytics_sessions
      WHERE created_at BETWEEN ? AND ?
      GROUP BY device_type
    `, [dateFrom, dateTo]);

    // События
    const [events] = await pool.execute(`
      SELECT 
        event_type,
        event_category,
        COUNT(*) as count,
        SUM(event_value) as total_value
      FROM analytics_events
      WHERE created_at BETWEEN ? AND ?
      GROUP BY event_type, event_category
      ORDER BY count DESC
    `, [dateFrom, dateTo]);

    res.json({
      general: general[0],
      topPages,
      trafficSources,
      devices,
      events
    });
  } catch (error) {
    next(error);
  }
});

// Получить статистику воронки продаж
router.get('/funnel-stats', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = to || new Date().toISOString();

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(visited_site_at) as visited_site,
        COUNT(viewed_product_at) as viewed_product,
        COUNT(added_to_cart_at) as added_to_cart,
        COUNT(started_checkout_at) as started_checkout,
        COUNT(filled_name_at) as filled_name,
        COUNT(filled_phone_at) as filled_phone,
        COUNT(selected_delivery_at) as selected_delivery,
        COUNT(filled_delivery_at) as filled_delivery,
        COUNT(selected_payment_at) as selected_payment,
        COUNT(clicked_submit_at) as clicked_submit,
        COUNT(completed_order_at) as completed_order,
        COUNT(paid_order_at) as paid_order,
        AVG(cart_total) as avg_cart_value,
        drop_stage,
        COUNT(*) as drop_count
      FROM analytics_funnel
      WHERE created_at BETWEEN ? AND ?
      GROUP BY drop_stage WITH ROLLUP
    `, [dateFrom, dateTo]);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Получить настройки аналитики
router.get('/settings', async (req, res, next) => {
  try {
    const [settings] = await pool.execute('SELECT * FROM analytics_settings');
    
    const result = {};
    settings.forEach(s => {
      result[s.setting_key] = s.setting_value;
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Обновить настройки аналитики
router.put('/settings', async (req, res, next) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      await pool.execute(
        `INSERT INTO analytics_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, value, value]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;

