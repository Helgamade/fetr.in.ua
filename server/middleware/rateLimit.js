import rateLimit from 'express-rate-limit';
import pool from '../db.js';

/**
 * Получение IP адреса клиента (учитывая прокси)
 */
export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    req.connection.remoteAddress ||
    'unknown'
  );
}

/**
 * Проверка, заблокирован ли IP адрес
 */
export async function checkBlockedIp(req, res, next) {
  try {
    const ip = getClientIp(req);

    const [blocked] = await pool.execute(
      'SELECT * FROM blocked_ips WHERE ip_address = ? AND blocked_until > NOW()',
      [ip]
    );

    if (blocked.length > 0) {
      const blockedUntil = new Date(blocked[0].blocked_until);
      const remainingMinutes = Math.ceil((blockedUntil - new Date()) / 60000);

      return res.status(429).json({
        error: 'IP адреса тимчасово заблоковано',
        reason: blocked[0].reason,
        blockedUntil: blockedUntil.toISOString(),
        remainingMinutes,
      });
    }

    next();
  } catch (error) {
    console.error('[IP Check] Error:', error);
    next();
  }
}

/**
 * Логирование попытки входа
 */
export async function logLoginAttempt(email, ip, attemptType, success, failureReason = null, userAgent = null) {
  try {
    await pool.execute(
      `INSERT INTO login_attempts (email, ip_address, attempt_type, success, failure_reason, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, ip, attemptType, success, failureReason, userAgent]
    );
  } catch (error) {
    console.error('[Login Attempt Log] Error:', error);
  }
}

/**
 * Блокировка IP адреса
 */
export async function blockIp(ip, reason, durationSeconds = 3600) {
  try {
    const blockedUntil = new Date(Date.now() + durationSeconds * 1000);

    await pool.execute(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_until)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         reason = VALUES(reason),
         blocked_until = VALUES(blocked_until),
         blocked_at = NOW()`,
      [ip, reason, blockedUntil]
    );

    console.log(`[IP Block] Blocked ${ip} for ${durationSeconds}s. Reason: ${reason}`);
  } catch (error) {
    console.error('[IP Block] Error:', error);
  }
}

/**
 * Проверка количества неудачных попыток входа
 */
export async function checkFailedAttempts(email, ip) {
  try {
    // Получаем настройки из базы
    const [settings] = await pool.execute(
      'SELECT key_name, value FROM settings WHERE key_name IN (?, ?)',
      ['max_login_attempts', 'login_block_duration']
    );

    const maxAttempts = parseInt(settings.find(s => s.key_name === 'max_login_attempts')?.value || '5');
    const blockDuration = parseInt(settings.find(s => s.key_name === 'login_block_duration')?.value || '3600');

    // Подсчитываем неудачные попытки за последние 15 минут
    const [attempts] = await pool.execute(
      `SELECT COUNT(*) as count FROM login_attempts
       WHERE (email = ? OR ip_address = ?)
       AND success = FALSE
       AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
      [email, ip]
    );

    const failedCount = attempts[0]?.count || 0;

    if (failedCount >= maxAttempts) {
      await blockIp(ip, `Перевищено ліміт спроб входу (${failedCount}/${maxAttempts})`, blockDuration);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Failed Attempts Check] Error:', error);
    return true; // В случае ошибки не блокируем
  }
}

/**
 * Rate limiter для общих запросов (100 запросов в 15 минут)
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  message: 'Забагато запитів з цієї IP адреси. Спробуйте пізніше.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = getClientIp(req);
    console.log(`[Rate Limit] General limit exceeded for IP: ${ip}`);
    res.status(429).json({
      error: 'Забагато запитів. Спробуйте пізніше.',
    });
  },
});

/**
 * Rate limiter для API (300 запросов в 15 минут)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Ліміт API запитів перевищено.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Пропускаем rate limit для авторизованных админов
    return req.user && req.user.role === 'admin';
  },
});

/**
 * Rate limiter для страниц входа (5 попыток в минуту)
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 5, // максимум 5 попыток
  message: 'Забагато спроб входу. Зачекайте хвилину.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не считаем успешные запросы
  handler: async (req, res) => {
    const ip = getClientIp(req);
    console.log(`[Rate Limit] Login limit exceeded for IP: ${ip}`);
    
    // Блокируем IP на час после превышения лимита
    await blockIp(ip, 'Перевищено ліміт спроб входу за хвилину', 3600);
    
    res.status(429).json({
      error: 'Забагато спроб входу. IP адресу заблоковано на 1 годину.',
    });
  },
});

/**
 * Rate limiter для админ панели (строже ограничения)
 */
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: 'Забагато спроб доступу до адмін панелі.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: async (req, res) => {
    const ip = getClientIp(req);
    console.log(`[Rate Limit] Admin limit exceeded for IP: ${ip}`);
    
    await blockIp(ip, 'Підозріла активність: спроби доступу до адмін панелі', 7200);
    
    res.status(429).json({
      error: 'Підозріла активність виявлена. IP адресу заблоковано.',
    });
  },
});

/**
 * Очистка старых записей о попытках входа (запускать по крону)
 */
export async function cleanupOldAttempts() {
  try {
    // Удаляем попытки старше 30 дней
    await pool.execute(
      'DELETE FROM login_attempts WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    // Удаляем истекшие блокировки
    await pool.execute(
      'DELETE FROM blocked_ips WHERE blocked_until < NOW()'
    );

    console.log('[Cleanup] Old login attempts and expired blocks cleaned up');
  } catch (error) {
    console.error('[Cleanup] Error:', error);
  }
}

// Запускаем очистку каждые 24 часа
setInterval(cleanupOldAttempts, 24 * 60 * 60 * 1000);

