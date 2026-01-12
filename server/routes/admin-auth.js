import express from 'express';
import bcrypt from 'bcrypt';
import { generateTokenPair, verifyRefreshToken, generateAccessToken } from '../utils/jwt.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { adminRateLimiter, checkBlockedIp, logLoginAttempt, getClientIp, checkFailedAttempts, blockIp } from '../middleware/rateLimit.js';
import { adminGuard, logAdminAction, checkAdminIpWhitelist } from '../middleware/adminGuard.js';
import pool from '../db.js';

const router = express.Router();

/**
 * POST /api/admin-auth/login
 * Вход для администраторов (если будет email/password вход)
 * ВАЖНО: Google OAuth - основной способ входа
 */
router.post('/login',
  checkBlockedIp,
  adminRateLimiter,
  async (req, res) => {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;
    
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        await logLoginAttempt(email, ip, 'admin_login', false, 'Missing credentials', userAgent);
        return res.status(400).json({ error: 'Email та пароль обов\'язкові.' });
      }

      // Проверяем количество неудачных попыток
      const canAttempt = await checkFailedAttempts(email, ip);
      if (!canAttempt) {
        return res.status(429).json({ 
          error: 'IP адресу заблоковано через перевищення ліміту спроб входу.' 
        });
      }

      // Ищем пользователя
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        await logLoginAttempt(email, ip, 'admin_login', false, 'User not found', userAgent);
        return res.status(401).json({ error: 'Невірний email або пароль.' });
      }

      const user = users[0];

      // Проверяем роль
      if (user.role !== 'admin') {
        await logLoginAttempt(email, ip, 'admin_login', false, 'Not admin role', userAgent);
        console.log(`[Admin Login] Non-admin user ${email} attempted admin login from IP ${ip}`);
        
        // Блокируем IP за попытку доступа к админ панели без прав
        await blockIp(ip, 'Спроба входу до адмін панелі без прав', 7200);
        
        return res.status(403).json({ error: 'Доступ заборонено.' });
      }

      // Проверяем активность
      if (!user.is_active) {
        await logLoginAttempt(email, ip, 'admin_login', false, 'Account deactivated', userAgent);
        return res.status(403).json({ error: 'Обліковий запис деактивовано.' });
      }

      // Проверяем пароль
      if (!user.password_hash) {
        await logLoginAttempt(email, ip, 'admin_login', false, 'No password set', userAgent);
        return res.status(401).json({ error: 'Використовуйте вхід через Google.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        await logLoginAttempt(email, ip, 'admin_login', false, 'Wrong password', userAgent);
        return res.status(401).json({ error: 'Невірний email або пароль.' });
      }

      // Проверяем IP whitelist
      const [settings] = await pool.execute(
        'SELECT value FROM settings WHERE key_name = ?',
        ['admin_ip_whitelist']
      );

      if (settings.length > 0 && settings[0].value) {
        const whitelist = JSON.parse(settings[0].value);
        if (Array.isArray(whitelist) && whitelist.length > 0) {
          const isAllowed = whitelist.some(allowedIp => {
            if (allowedIp.includes('/')) {
              return ip.startsWith(allowedIp.split('/')[0].split('.').slice(0, 3).join('.'));
            }
            return ip === allowedIp;
          });

          if (!isAllowed) {
            await logLoginAttempt(email, ip, 'admin_login', false, 'IP not in whitelist', userAgent);
            console.log(`[Admin Login] IP ${ip} not in whitelist for user ${email}`);
            return res.status(403).json({ error: 'Доступ з цієї IP адреси заборонено.' });
          }
        }
      }

      // Успешный вход
      const { accessToken, refreshToken } = generateTokenPair(user);

      // Сохраняем сессию
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
      await pool.execute(
        `INSERT INTO user_sessions (user_id, session_token, refresh_token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, accessToken, refreshToken, ip, userAgent, expiresAt]
      );

      // Обновляем время последнего входа
      await pool.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      // Логируем успешный вход
      await logLoginAttempt(email, ip, 'admin_login', true, null, userAgent);
      await logAdminAction(user.id, 'ADMIN_LOGIN', null, null, null, { ip, userAgent }, { ip, body: {} });

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar_url,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('[Admin Login] Error:', error);
      await logLoginAttempt(req.body.email, ip, 'admin_login', false, error.message, userAgent);
      res.status(500).json({ error: 'Помилка входу.' });
    }
  }
);

/**
 * GET /api/admin-auth/verify
 * Проверка прав администратора
 */
router.get('/verify',
  authenticate,
  authorize('admin'),
  checkAdminIpWhitelist,
  (req, res) => {
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar_url,
        role: req.user.role,
      },
    });
  }
);

/**
 * GET /api/admin-auth/logs
 * Получение логов действий администраторов
 */
router.get('/logs',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const { limit = 100, offset = 0, userId, action } = req.query;

      let query = `
        SELECT 
          al.*,
          u.name as user_name,
          u.email as user_email
        FROM admin_logs al
        JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (userId) {
        query += ' AND al.user_id = ?';
        params.push(userId);
      }

      if (action) {
        query += ' AND al.action = ?';
        params.push(action);
      }

      query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [logs] = await pool.execute(query, params);

      // Получаем общее количество
      let countQuery = 'SELECT COUNT(*) as total FROM admin_logs WHERE 1=1';
      const countParams = [];

      if (userId) {
        countQuery += ' AND user_id = ?';
        countParams.push(userId);
      }

      if (action) {
        countQuery += ' AND action = ?';
        countParams.push(action);
      }

      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        logs,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } catch (error) {
      console.error('[Admin Logs] Error:', error);
      res.status(500).json({ error: 'Помилка отримання логів.' });
    }
  }
);

/**
 * GET /api/admin-auth/login-attempts
 * Получение попыток входа (для мониторинга безопасности)
 */
router.get('/login-attempts',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const { limit = 100, offset = 0, email, ip } = req.query;

      let query = 'SELECT * FROM login_attempts WHERE 1=1';
      const params = [];

      if (email) {
        query += ' AND email = ?';
        params.push(email);
      }

      if (ip) {
        query += ' AND ip_address = ?';
        params.push(ip);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [attempts] = await pool.execute(query, params);

      res.json(attempts);
    } catch (error) {
      console.error('[Login Attempts] Error:', error);
      res.status(500).json({ error: 'Помилка отримання спроб входу.' });
    }
  }
);

/**
 * GET /api/admin-auth/blocked-ips
 * Получение заблокированных IP адресов
 */
router.get('/blocked-ips',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const [blocked] = await pool.execute(
        'SELECT * FROM blocked_ips WHERE blocked_until > NOW() ORDER BY blocked_at DESC'
      );

      res.json(blocked);
    } catch (error) {
      console.error('[Blocked IPs] Error:', error);
      res.status(500).json({ error: 'Помилка отримання заблокованих IP.' });
    }
  }
);

/**
 * DELETE /api/admin-auth/blocked-ips/:ip
 * Разблокировка IP адреса
 */
router.delete('/blocked-ips/:ip',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const { ip } = req.params;

      const [result] = await pool.execute(
        'DELETE FROM blocked_ips WHERE ip_address = ?',
        [ip]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'IP адресу не знайдено.' });
      }

      await logAdminAction(req.user.id, 'UNBLOCK_IP', 'blocked_ips', ip, null, null, req);

      res.json({ message: 'IP адресу розблоковано.' });
    } catch (error) {
      console.error('[Unblock IP] Error:', error);
      res.status(500).json({ error: 'Помилка розблокування IP.' });
    }
  }
);

export default router;

