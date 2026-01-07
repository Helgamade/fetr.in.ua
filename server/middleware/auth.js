import { verifyAccessToken } from '../utils/jwt.js';
import pool from '../db.js';

/**
 * Middleware для проверки авторизации пользователя
 * Извлекает JWT токен из заголовка Authorization или cookie
 */
export async function authenticate(req, res, next) {
  try {
    // Получаем токен из заголовка или cookie
    let token = null;

    // Проверяем заголовок Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Если токена нет в заголовке, проверяем cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Не авторизован. Требуется токен.' });
    }

    // Верифицируем токен
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Недействительный или просроченный токен.' });
    }

    // Проверяем, существует ли пользователь и активен ли он
    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active, avatar_url FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден.' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Аккаунт деактивирован.' });
    }

    // Добавляем пользователя в request
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    return res.status(500).json({ error: 'Ошибка авторизации.' });
  }
}

/**
 * Middleware для проверки роли пользователя
 * @param {string[]} allowedRoles - Массив разрешенных ролей
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Не авторизован.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Доступ запрещен. Недостаточно прав.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware для опциональной авторизации
 * Если токен есть - проверяет, если нет - пропускает
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next();
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active, avatar_url FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length > 0 && users[0].is_active) {
      req.user = users[0];
    }

    next();
  } catch (error) {
    console.error('[Optional Auth Middleware] Error:', error);
    next();
  }
}

