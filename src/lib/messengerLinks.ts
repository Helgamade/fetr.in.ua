/**
 * Утилиты для генерации ссылок на мессенджеры на основе номера телефона
 */

/**
 * Очищает номер телефона от пробелов и других символов
 */
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
}

/**
 * Форматирует номер для использования в URL
 */
function formatPhoneForUrl(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  // Убираем + если есть, для некоторых мессенджеров
  return cleaned.replace(/^\+/, '');
}

/**
 * Генерирует ссылку на Viber чат
 * Формат: viber://chat?number=%2B380938794088
 */
export function getViberLink(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  // Кодируем номер для URL
  const encoded = encodeURIComponent(cleaned);
  return `viber://chat?number=${encoded}`;
}

/**
 * Генерирует ссылку на Telegram чат
 * Формат: https://t.me/+380938794088
 */
export function getTelegramLink(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  return `https://t.me/${cleaned}`;
}

/**
 * Генерирует ссылку на WhatsApp чат
 * Формат: https://wa.me/380938794088 (без +)
 */
export function getWhatsAppLink(phone: string): string {
  const formatted = formatPhoneForUrl(phone);
  return `https://wa.me/${formatted}`;
}

