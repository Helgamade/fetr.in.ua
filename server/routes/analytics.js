import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Функция для определения города по IP-адресу
async function getLocationByIP(ip) {
  try {
    // Исключаем локальные и внутренние IP
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return { city: null, country: null };
    }

    // Берем первый IP из списка, если их несколько (x-forwarded-for)
    const cleanIP = ip.split(',')[0].trim();

    // Используем ip-api.com (бесплатный, 45 запросов/минуту)
    // Используем AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`http://ip-api.com/json/${cleanIP}?fields=city,country`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { city: null, country: null };
      }

      const data = await response.json();
    
      // ip-api.com возвращает status: 'success' при успехе, 'fail' при ошибке
      if (data.status === 'success') {
        return {
          city: data.city || null,
          country: data.country || null,
        };
      }

      return { city: null, country: null };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Analytics] Timeout getting location by IP');
      } else {
        console.error('[Analytics] Error getting location by IP:', fetchError.message);
      }
      return { city: null, country: null };
    }
  } catch (error) {
    console.error('[Analytics] Error getting location by IP:', error.message);
    return { city: null, country: null };
  }
}

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

    // Определяем город по IP для новых сессий
    let city = null;
    let country = null;
    
    // Проверяем существование сессии
    const [existing] = await pool.execute(
      'SELECT id, city, country FROM analytics_sessions WHERE session_id = ?',
      [sessionId]
    );

    if (existing.length > 0) {
      // Если город уже есть - используем его, иначе пытаемся определить
      if (!existing[0].city && ipAddress) {
        const location = await getLocationByIP(ipAddress);
        city = location.city;
        country = location.country;
        
        // Обновляем сессию с городом, если определили
        if (city || country) {
          await pool.execute(`
            UPDATE analytics_sessions SET
              last_activity_at = CURRENT_TIMESTAMP,
              is_online = true,
              user_id = COALESCE(?, user_id),
              cart_items_count = COALESCE(?, cart_items_count),
              pages_viewed = pages_viewed + 1,
              city = COALESCE(?, city),
              country = COALESCE(?, country)
            WHERE session_id = ?
          `, [toNull(userId), toNullOrNumber(cartItemsCount), toNull(city), toNull(country), sessionId]);
        } else {
          // Обновляем без города
          await pool.execute(`
            UPDATE analytics_sessions SET
              last_activity_at = CURRENT_TIMESTAMP,
              is_online = true,
              user_id = COALESCE(?, user_id),
              cart_items_count = COALESCE(?, cart_items_count),
              pages_viewed = pages_viewed + 1
            WHERE session_id = ?
          `, [toNull(userId), toNullOrNumber(cartItemsCount), sessionId]);
        }
      } else {
        // Город уже есть или нет IP - просто обновляем активность
        await pool.execute(`
          UPDATE analytics_sessions SET
            last_activity_at = CURRENT_TIMESTAMP,
            is_online = true,
            user_id = COALESCE(?, user_id),
            cart_items_count = COALESCE(?, cart_items_count),
            pages_viewed = pages_viewed + 1
          WHERE session_id = ?
        `, [toNull(userId), toNullOrNumber(cartItemsCount), sessionId]);
      }
    } else {
      // Создаем новую сессию - определяем город
      if (ipAddress) {
        const location = await getLocationByIP(ipAddress);
        city = location.city;
        country = location.country;
      }
      
      await pool.execute(`
        INSERT INTO analytics_sessions (
          session_id, user_id, visitor_fingerprint,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          referrer, landing_page, device_type, browser, os,
          screen_resolution, language, ip_address, country, city, cart_items_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sessionId, toNull(userId), fingerprint,
        toNull(utmSource), toNull(utmMedium), toNull(utmCampaign), toNull(utmTerm), toNull(utmContent),
        toNull(referrer), toNull(landingPage), toNull(deviceType), toNull(browser), toNull(os),
        toNull(screenResolution), toNull(language), toNull(ipAddress), toNull(country), toNull(city), toNullOrNumber(cartItemsCount)
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

    // Обновляем cart_items_count в analytics_sessions при событиях корзины
    if (eventType === 'add_to_cart' || eventType === 'remove_from_cart' || eventType === 'quick_add_to_cart' || eventType === 'update_cart_quantity') {
      const cartItemsCount = req.body.cartItemsCount;
      console.log('[Analytics Event] Updating cart_items_count:', { eventType, cartItemsCount, sessionId });
      if (cartItemsCount !== undefined && cartItemsCount !== null) {
        await pool.execute(`
          UPDATE analytics_sessions
          SET cart_items_count = ?,
              last_activity_at = CURRENT_TIMESTAMP,
              is_online = true
          WHERE session_id = ?
        `, [Number(cartItemsCount), sessionId]);
        console.log('[Analytics Event] cart_items_count updated successfully');
      } else {
        console.log('[Analytics Event] WARNING: cartItemsCount is undefined or null');
      }
    }

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
    // ВАЖНО: cart_items_count берем из analytics_sessions, но если NULL или 0,
    // восстанавливаем из последней записи в analytics_events
    const [sessions] = await pool.execute(`
      SELECT 
        s.session_id,
        s.user_id,
        s.visitor_fingerprint,
        s.utm_source,
        s.utm_medium,
        s.utm_campaign,
        s.utm_term,
        s.utm_content,
        s.referrer,
        s.landing_page,
        s.device_type,
        s.browser,
        s.os,
        s.screen_resolution,
        s.language,
        s.ip_address,
        s.country,
        s.city,
        s.pages_viewed,
        s.total_time_spent,
        COALESCE(
          (
            SELECT CAST(JSON_EXTRACT(event_data, '$.cartItemsCount') AS UNSIGNED)
            FROM analytics_events
            WHERE session_id = s.session_id
              AND event_type IN ('add_to_cart', 'remove_from_cart', 'quick_add_to_cart', 'update_cart_quantity')
              AND JSON_EXTRACT(event_data, '$.cartItemsCount') IS NOT NULL
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          ),
          0
        ) as cart_items_count,
        s.is_online,
        s.last_activity_at,
        s.created_at,
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
    // Если даты переданы как YYYY-MM-DD, добавляем время для корректного сравнения
    let dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let dateTo = to || new Date().toISOString();
    
    // Если дата в формате YYYY-MM-DD, добавляем время начала/конца дня
    if (from && from.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateFrom = `${from}T00:00:00.000Z`;
    }
    if (to && to.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateTo = `${to}T23:59:59.999Z`;
    }
    
    console.log('[Analytics Stats] Fetching stats from', dateFrom, 'to', dateTo);

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

    const result = {
      general: general[0] || {},
      topPages: topPages || [],
      trafficSources: trafficSources || [],
      devices: devices || [],
      events: events || []
    };
    console.log('[Analytics Stats] Returning:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Получить статистику воронки продаж
router.get('/funnel-stats', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    // Если даты переданы как YYYY-MM-DD, добавляем время для корректного сравнения
    let dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let dateTo = to || new Date().toISOString();
    
    // Если дата в формате YYYY-MM-DD, добавляем время начала/конца дня
    if (from && from.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateFrom = `${from}T00:00:00.000Z`;
    }
    if (to && to.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateTo = `${to}T23:59:59.999Z`;
    }
    
    console.log('[Analytics Funnel] Fetching funnel stats from', dateFrom, 'to', dateTo);

    // Исправляем запрос - убираем GROUP BY drop_stage WITH ROLLUP, так как это вызывает проблемы
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
        AVG(cart_total) as avg_cart_value
      FROM analytics_funnel
      WHERE created_at BETWEEN ? AND ?
    `, [dateFrom, dateTo]);

    // Возвращаем первый элемент массива (результат запроса) или пустой объект
    const result = stats[0] || {};
    console.log('[Analytics Funnel] Returning:', JSON.stringify(result, null, 2));
    res.json(result);
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

