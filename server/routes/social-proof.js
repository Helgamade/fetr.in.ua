import express from 'express';
import pool from '../db.js';
import { adminGuard } from '../middleware/adminGuard.js';

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
router.put('/settings', adminGuard, async (req, res, next) => {
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
router.put('/notification-types/:id', adminGuard, async (req, res, next) => {
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
router.post('/names', adminGuard, async (req, res, next) => {
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
router.delete('/names/:id', adminGuard, async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM social_proof_names WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Логи уведомлений с пагинацией
router.get('/logs', adminGuard, async (req, res, next) => {
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
router.get('/stats', adminGuard, async (req, res, next) => {
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
