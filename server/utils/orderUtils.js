import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const TRACKING_SECRET = process.env.TRACKING_SECRET || 'fetr-in-ua-secret-key-2024-change-in-production';

/**
 * Генерирует цифровой токен для отслеживания заказа (только цифры)
 * @param {number|string} orderNumber - Номер заказа (305317, 305318, ...)
 * @returns {string} - 10-цифровой токен
 */
export function generateTrackingToken(orderNumber) {
  const hash = crypto
    .createHash('sha256')
    .update(String(orderNumber) + TRACKING_SECRET)
    .digest('hex');
  
  // Преобразуем hex в цифры: берем только цифры из хеша
  const digits = hash.replace(/[^0-9]/g, '');
  
  // Берем первые 10 цифр
  // Если цифр меньше 10, дополняем хешем еще раз
  let token = digits.substring(0, 10);
  if (token.length < 10) {
    const additionalHash = crypto
      .createHash('sha256')
      .update(String(orderNumber) + TRACKING_SECRET + 'additional')
      .digest('hex');
    const additionalDigits = additionalHash.replace(/[^0-9]/g, '');
    token = (token + additionalDigits).substring(0, 10);
  }
  
  return token;
}

/**
 * Возвращает номер заказа как число (без префикса ORD-)
 * @param {number} id - AUTO_INCREMENT id из базы данных
 * @returns {number} - Номер заказа (305317, 305318, ...)
 */
export function getOrderNumber(id) {
  return id; // Просто возвращаем id, так как AUTO_INCREMENT начинается с 305317
}

