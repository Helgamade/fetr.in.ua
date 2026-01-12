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

    // Верифицируем токен - только JWT проверка, БЕЗ проверки БД
    // Максимально упрощено - токен живет 1 год, проверка пользователя не нужна при каждом запросе
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Недействительный или просроченный токен.' });
    }

    // Просто используем данные из токена - без проверки БД
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name || decoded.email,
      avatar_url: decoded.avatar || null,
    };
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

    // Упрощенная проверка - только JWT, без проверки БД для optional auth
    // Просто добавляем данные из токена
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('[Optional Auth Middleware] Error:', error);
    next();
  }
}

