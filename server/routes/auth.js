import express from 'express';
import { passport } from '../utils/oauth.js';
import { generateTokenPair, verifyRefreshToken, generateAccessToken, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../utils/jwt.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { loginRateLimiter, checkBlockedIp, logLoginAttempt, getClientIp, checkFailedAttempts, refreshRateLimiter } from '../middleware/rateLimit.js';
import pool from '../db.js';

const router = express.Router();

const FRONTEND_URL = process.env.CORS_ORIGIN || 'http://localhost:8080';

/**
 * GET /api/auth/google
 * Инициация авторизации через Google
 */
router.get('/google', 
  checkBlockedIp,
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

/**
 * GET /api/auth/google/callback
 * Callback от Google после авторизации
 */
router.get('/google/callback',
  checkBlockedIp,
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`
  }),
  async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_user_data`);
      }

      // Генерируем токены
      const { accessToken, refreshToken } = generateTokenPair(user);

      // Сохраняем сессию в базе
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

      await pool.execute(
        `INSERT INTO user_sessions (user_id, session_token, refresh_token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, accessToken, refreshToken, ip, userAgent, expiresAt]
      );

      // Логируем успешный вход
      await logLoginAttempt(user.email, ip, 'login', true, null, userAgent);

      // Перенаправляем на фронтенд с токенами в URL (frontend сохранит их в cookie/localStorage)
      res.redirect(`${FRONTEND_URL}/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url,
        role: user.role
      }))}`);
    } catch (error) {
      console.error('[Auth Callback] Error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=callback_error`);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Обновление access token используя refresh token
 * С реализацией Refresh Token Rotation для безопасности
 */
router.post('/refresh', 
  checkBlockedIp,
  refreshRateLimiter, // Rate limiting для защиты от брутфорса
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token обов\'язковий.' });
      }

      // Верифицируем refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({ error: 'Недійсний або прострочений refresh token.' });
      }

      // Проверяем, существует ли сессия и не была ли она уже использована
      const [sessions] = await pool.execute(
        'SELECT * FROM user_sessions WHERE refresh_token = ? AND expires_at > NOW()',
        [refreshToken]
      );

      if (sessions.length === 0) {
        return res.status(401).json({ error: 'Сесія не знайдена або прострочена.' });
      }

      const session = sessions[0];

      // Проверяем пользователя
      const [users] = await pool.execute(
        'SELECT id, name, email, role, is_active, avatar_url FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0 || !users[0].is_active) {
        return res.status(401).json({ error: 'Користувач не знайдений або деактивований.' });
      }

      const user = users[0];

      // Генерируем новую пару токенов (Refresh Token Rotation)
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

      // Обновляем сессию с новыми токенами (старый refresh token инвалидируется)
      await pool.execute(
        `UPDATE user_sessions 
         SET session_token = ?, refresh_token = ?, last_activity = NOW(), expires_at = ?
         WHERE id = ?`,
        [newAccessToken, newRefreshToken, expiresAt, session.id]
      );

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken, // Новый refresh token (старый инвалидирован)
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar_url,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('[Refresh Token] Error:', error);
      res.status(500).json({ error: 'Помилка оновлення токена.' });
    }
  }
);

/**
 * POST /api/auth/logout
 * Выход из системы (удаление сессии)
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Удаляем все сессии пользователя
    await pool.execute(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [userId]
    );

    res.json({ message: 'Успішно вийшли з системи.' });
  } catch (error) {
    console.error('[Logout] Error:', error);
    res.status(500).json({ error: 'Помилка виходу.' });
  }
});

/**
 * GET /api/auth/me
 * Получение информации о текущем пользователе
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar_url,
      role: user.role,
    });
  } catch (error) {
    console.error('[Get Me] Error:', error);
    res.status(500).json({ error: 'Помилка отримання даних користувача.' });
  }
});

/**
 * GET /api/auth/sessions
 * Получение списка активных сессий пользователя
 */
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [sessions] = await pool.execute(
      `SELECT id, ip_address, user_agent, last_activity, expires_at, created_at
       FROM user_sessions
       WHERE user_id = ? AND expires_at > NOW()
       ORDER BY last_activity DESC`,
      [userId]
    );

    res.json(sessions);
  } catch (error) {
    console.error('[Get Sessions] Error:', error);
    res.status(500).json({ error: 'Помилка отримання сесій.' });
  }
});

/**
 * DELETE /api/auth/sessions/:id
 * Удаление конкретной сессии
 */
router.delete('/sessions/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    const [result] = await pool.execute(
      'DELETE FROM user_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Сесія не знайдена.' });
    }

    res.json({ message: 'Сесію видалено.' });
  } catch (error) {
    console.error('[Delete Session] Error:', error);
    res.status(500).json({ error: 'Помилка видалення сесії.' });
  }
});

/**
 * POST /api/auth/link-orders
 * Привязка заказов по email к авторизованному пользователю
 */
router.post('/link-orders', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Находим все заказы с таким email без привязки к user_id
    const [result] = await pool.execute(
      'UPDATE orders SET user_id = ? WHERE customer_email = ? AND user_id IS NULL',
      [userId, userEmail]
    );

    res.json({
      message: 'Замовлення успішно прив\'язані до облікового запису.',
      linkedOrders: result.affectedRows,
    });
  } catch (error) {
    console.error('[Link Orders] Error:', error);
    res.status(500).json({ error: 'Помилка прив\'язки замовлень.' });
  }
});

export default router;

