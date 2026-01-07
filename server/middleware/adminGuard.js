import pool from '../db.js';
import { getClientIp } from './rateLimit.js';

/**
 * Логирование действий администратора
 */
export async function logAdminAction(userId, action, entityType = null, entityId = null, oldValues = null, newValues = null, req) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;

    await pool.execute(
      `INSERT INTO admin_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ip,
        userAgent,
      ]
    );
  } catch (error) {
    console.error('[Admin Log] Error:', error);
  }
}

/**
 * Middleware для проверки IP whitelist (если настроен)
 */
export async function checkAdminIpWhitelist(req, res, next) {
  try {
    const [settings] = await pool.execute(
      'SELECT value FROM settings WHERE key_name = ?',
      ['admin_ip_whitelist']
    );

    if (!settings.length || !settings[0].value) {
      return next();
    }

    const whitelist = JSON.parse(settings[0].value);

    // Если whitelist пустой, пропускаем всех
    if (!Array.isArray(whitelist) || whitelist.length === 0) {
      return next();
    }

    const clientIp = getClientIp(req);

    // Проверяем, есть ли IP в whitelist
    const isAllowed = whitelist.some(allowedIp => {
      // Поддержка CIDR нотации и точного совпадения
      if (allowedIp.includes('/')) {
        // CIDR проверка (упрощенная)
        return clientIp.startsWith(allowedIp.split('/')[0].split('.').slice(0, 3).join('.'));
      }
      return clientIp === allowedIp;
    });

    if (!isAllowed) {
      console.log(`[Admin Guard] IP ${clientIp} not in whitelist. Access denied.`);
      return res.status(403).json({
        error: 'Доступ до адмін панелі заборонено з цієї IP адреси.',
      });
    }

    next();
  } catch (error) {
    console.error('[Admin IP Whitelist] Error:', error);
    // В случае ошибки пропускаем (безопаснее, чем блокировать)
    next();
  }
}

/**
 * Middleware для защиты админ роутов
 * Комбинирует проверку авторизации, роли и IP
 */
export function adminGuard(req, res, next) {
  // Проверяем, что пользователь авторизован
  if (!req.user) {
    return res.status(401).json({ error: 'Не авторизован.' });
  }

  // Проверяем роль
  if (req.user.role !== 'admin') {
    console.log(`[Admin Guard] User ${req.user.email} (role: ${req.user.role}) attempted admin access`);
    
    // Логируем подозрительную активность
    logAdminAction(
      req.user.id,
      'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
      null,
      null,
      null,
      { path: req.path, method: req.method },
      req
    );

    return res.status(403).json({
      error: 'Доступ заборонено. Потрібні права адміністратора.',
    });
  }

  // Логируем успешный вход в админ панель
  if (req.path === '/admin' || req.path === '/admin/') {
    logAdminAction(req.user.id, 'ADMIN_LOGIN', null, null, null, null, req);
  }

  next();
}

/**
 * Wrapper для логирования CRUD операций админа
 */
export function withAdminLogging(action, entityType) {
  return async (req, res, next) => {
    // Сохраняем оригинальные методы
    const originalJson = res.json;
    const originalSend = res.send;

    // Перехватываем ответ для логирования
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params.id || data?.id || null;
        
        logAdminAction(
          req.user?.id,
          action,
          entityType,
          entityId,
          req.body,
          data,
          req
        );
      }

      return originalJson.call(this, data);
    };

    res.send = function (data) {
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Проверка сессии администратора
 * Проверяет, что IP и User-Agent не изменились
 */
export async function validateAdminSession(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next();
  }

  try {
    const currentIp = getClientIp(req);
    const currentUserAgent = req.headers['user-agent'] || '';

    // Получаем последнюю сессию админа
    const [sessions] = await pool.execute(
      `SELECT ip_address, user_agent FROM user_sessions
       WHERE user_id = ? AND expires_at > NOW()
       ORDER BY last_activity DESC LIMIT 1`,
      [req.user.id]
    );

    if (sessions.length > 0) {
      const session = sessions[0];

      // Проверяем, изменился ли IP (подозрительно)
      if (session.ip_address && session.ip_address !== currentIp) {
        console.log(`[Admin Session] IP changed for admin ${req.user.email}: ${session.ip_address} -> ${currentIp}`);
        
        await logAdminAction(
          req.user.id,
          'SUSPICIOUS_IP_CHANGE',
          null,
          null,
          { oldIp: session.ip_address },
          { newIp: currentIp },
          req
        );

        // Можно добавить дополнительную проверку (2FA) или уведомление
      }
    }

    next();
  } catch (error) {
    console.error('[Admin Session Validation] Error:', error);
    next();
  }
}

