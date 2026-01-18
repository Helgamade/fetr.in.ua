import express from 'express';
import pool from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAdminAction } from '../middleware/adminGuard.js';

const router = express.Router();

// Получить настройки
router.get('/settings', async (req, res, next) => {
  try {
    const [settings] = await pool.execute(
      'SELECT setting_key, setting_value, setting_type FROM social_proof_settings'
    );
    
    const result = {};
    settings.forEach(s => {
      if (s.setting_type === 'number') {
        result[s.setting_key] = Number(s.setting_value);
      } else if (s.setting_type === 'boolean') {
        result[s.setting_key] = s.setting_value === 'true';
      } else if (s.setting_type === 'json') {
        try {
          result[s.setting_key] = JSON.parse(s.setting_value);
        } catch (e) {
          result[s.setting_key] = s.setting_value;
        }
      } else {
        result[s.setting_key] = s.setting_value;
      }
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Сохранить настройки
router.put('/settings', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      const settingType = typeof value === 'number' ? 'number' 
        : typeof value === 'boolean' ? 'boolean'
        : 'string';
      
      const stringValue = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);
      
      await pool.execute(
        `INSERT INTO social_proof_settings (setting_key, setting_value, setting_type) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?, setting_type = ?`,
        [key, stringValue, settingType, stringValue, settingType]
      );
    }
    
    // Логируем изменение настроек
    if (req.user) {
      await logAdminAction(
        req.user.id,
        'UPDATE_SOCIAL_PROOF_SETTINGS',
        'social_proof_settings',
        null,
        null,
        updates,
        req
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Получить типы уведомлений
router.get('/notification-types', async (req, res, next) => {
  try {
    const [types] = await pool.execute(
      'SELECT * FROM social_proof_notification_types ORDER BY sort_order'
    );
    res.json(types);
  } catch (error) {
    next(error);
  }
});

// Обновить тип уведомления
router.put('/notification-types/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, template, is_enabled, sort_order } = req.body;
    
    await pool.execute(
      `UPDATE social_proof_notification_types 
       SET name = ?, template = ?, is_enabled = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, template, is_enabled, sort_order || 0, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Получить список имен
router.get('/names', async (req, res, next) => {
  try {
    const [names] = await pool.execute(
      'SELECT * FROM social_proof_names ORDER BY sort_order, name'
    );
    res.json(names);
  } catch (error) {
    next(error);
  }
});

// Добавить имя
router.post('/names', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO social_proof_names (name) VALUES (?)',
      [name.trim()]
    );
    res.json({ id: result.insertId, name: name.trim() });
  } catch (error) {
    next(error);
  }
});

// Удалить имя
router.delete('/names/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM social_proof_names WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Логи уведомлений с пагинацией
router.get('/logs', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, type, session_id } = req.query;
    const offset = (page - 1) * limit;
    
    let where = [];
    let params = [];
    
    if (type) {
      where.push('notification_type = ?');
      params.push(type);
    }
    
    if (session_id) {
      where.push('session_id = ?');
      params.push(session_id);
    }
    
    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    
    const [logs] = await pool.execute(
      `SELECT * FROM social_proof_notifications_log 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    
    const [count] = await pool.execute(
      `SELECT COUNT(*) as total FROM social_proof_notifications_log ${whereClause}`,
      params
    );
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count[0].total,
        totalPages: Math.ceil(count[0].total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Получить координаты по IP и город через НП (публичный endpoint для SocialProof)
router.get('/location-by-ip', async (req, res, next) => {
  try {
    // Получаем IP из запроса (аналогично analytics)
    let ipAddress = req.headers['x-forwarded-for'] 
      || req.headers['x-real-ip'] 
      || req.headers['cf-connecting-ip']
      || req.socket?.remoteAddress 
      || req.connection?.remoteAddress 
      || req.ip;

    if (ipAddress && typeof ipAddress === 'string' && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }

    // Нормализуем IP
    let cleanIP = String(ipAddress || '').split(',')[0].trim();
    if (cleanIP.startsWith('::ffff:')) {
      cleanIP = cleanIP.substring(7);
    }

    // Исключаем локальные IP
    if (!cleanIP || cleanIP === '::1' || cleanIP === '127.0.0.1' || 
        cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.') || 
        cleanIP.startsWith('172.') || cleanIP === 'localhost') {
      return res.json({ lat: null, lon: null, city_np: null, city_ip: null });
    }

    // Получаем координаты и город по IP через ip-api.com
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`http://ip-api.com/json/${cleanIP}?fields=status,city,country,lat,lon`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.json({ lat: null, lon: null, city_np: null, city_ip: null });
      }

      const data = await response.json();

      if (data.status !== 'success' || !data.lat || !data.lon) {
        return res.json({ lat: null, lon: null, city_np: null, city_ip: data.city || null });
      }

      const lat = parseFloat(data.lat);
      const lon = parseFloat(data.lon);
      const cityFromIP = data.city || null;

      // Определяем ближайшее отделение НП по координатам
      let cityFromNP = null;
      if (lat && lon) {
        const [warehouses] = await pool.execute(`
          SELECT 
            nw.city_description_ua as city,
            (
              6371 * acos(
                cos(radians(?)) * 
                cos(radians(nw.latitude)) * 
                cos(radians(nw.longitude) - radians(?)) + 
                sin(radians(?)) * 
                sin(radians(nw.latitude))
              )
            ) AS distance_km
          FROM nova_poshta_warehouses nw
          INNER JOIN nova_poshta_cities nc ON nw.city_ref = nc.ref
          WHERE nc.settlement_type_description_ua = 'місто'
            AND nw.latitude IS NOT NULL 
            AND nw.longitude IS NOT NULL
          HAVING distance_km <= 20
          ORDER BY distance_km ASC
          LIMIT 1
        `, [lat, lon, lat]);

        if (warehouses.length > 0) {
          cityFromNP = warehouses[0].city; // Уже на украинском из БД НП
        }
      }

      res.json({
        lat,
        lon,
        city_ip: cityFromIP, // Город из ip-api.com (может быть на английском)
        city_np: cityFromNP  // Город из НП на украинском (приоритетный)
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[Social Proof] Error getting location by IP:', fetchError.message);
      res.json({ lat: null, lon: null, city_np: null, city_ip: null });
    }
  } catch (error) {
    console.error('[Social Proof] Error in location-by-ip:', error);
    next(error);
  }
});

// Сохранить лог уведомления (публичный endpoint)
router.post('/log', async (req, res, next) => {
  try {
    const {
      session_id,
      visitor_fingerprint,
      notification_type,
      product_id,
      product_code,
      product_name,
      client_city_from_ip,
      client_country_from_ip,
      client_latitude,
      client_longitude,
      client_city_from_np,
      client_name,
      hours_ago,
      message_text,
      variables_used
    } = req.body;
    
    if (!session_id || !notification_type || !message_text) {
      return res.status(400).json({ error: 'session_id, notification_type and message_text are required' });
    }
    
    await pool.execute(
      `INSERT INTO social_proof_notifications_log (
        session_id, visitor_fingerprint, notification_type,
        product_id, product_code, product_name,
        client_city_from_ip, client_country_from_ip,
        client_latitude, client_longitude, client_city_from_np,
        client_name, hours_ago, message_text, variables_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session_id, visitor_fingerprint || null, notification_type,
        product_id || null, product_code || null, product_name || null,
        client_city_from_ip || null, client_country_from_ip || null,
        client_latitude || null, client_longitude || null, client_city_from_np || null,
        client_name || null, hours_ago || null, message_text,
        variables_used ? JSON.stringify(variables_used) : null
      ]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving social proof log:', error);
    next(error);
  }
});

// Статистика отправок
router.get('/stats', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { from, to } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (from && to) {
      dateFilter = 'WHERE created_at BETWEEN ? AND ?';
      params.push(from, to);
    }
    
    const [stats] = await pool.execute(
      `SELECT 
        notification_type,
        COUNT(*) as count,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM social_proof_notifications_log
      ${dateFilter}
      GROUP BY notification_type`,
      params
    );
    
    const [total] = await pool.execute(
      `SELECT COUNT(*) as total FROM social_proof_notifications_log ${dateFilter}`,
      params
    );
    
    res.json({
      byType: stats,
      total: total[0].total
    });
  } catch (error) {
    next(error);
  }
});

export default router;
