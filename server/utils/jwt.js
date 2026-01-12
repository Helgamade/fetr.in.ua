import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Генерация секретного ключа (должен быть в .env, но если нет - генерируем)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');

// Время жизни токенов (в секундах)
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 минут
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 дней (увеличено для удобства пользователей)

/**
 * Генерация Access Token (короткий срок жизни)
 * @param {Object} payload - Данные пользователя для токена
 * @returns {string} JWT токен
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'fetr.in.ua',
    audience: 'fetr.in.ua',
  });
}

/**
 * Генерация Refresh Token (длинный срок жизни)
 * @param {Object} payload - Данные пользователя для токена
 * @returns {string} JWT токен
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'fetr.in.ua',
    audience: 'fetr.in.ua',
  });
}

/**
 * Верификация Access Token
 * @param {string} token - JWT токен
 * @returns {Object|null} Декодированный payload или null
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'fetr.in.ua',
      audience: 'fetr.in.ua',
    });
  } catch (error) {
    console.error('[JWT] Access token verification failed:', error.message);
    return null;
  }
}

/**
 * Верификация Refresh Token
 * @param {string} token - JWT токен
 * @returns {Object|null} Декодированный payload или null
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'fetr.in.ua',
      audience: 'fetr.in.ua',
    });
  } catch (error) {
    console.error('[JWT] Refresh token verification failed:', error.message);
    return null;
  }
}

/**
 * Генерация случайного токена сессии
 * @returns {string} Случайный токен
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Генерация пары токенов (access + refresh)
 * @param {Object} user - Объект пользователя
 * @returns {Object} { accessToken, refreshToken }
 */
export function generateTokenPair(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY };

