import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирование цены: округление до целого и добавление разделителя тысяч
 * @param value - число для форматирования
 * @returns отформатированная строка (например, "1 500")
 */
export function formatPrice(value: number): string {
  const rounded = Math.round(value);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Получает конец текущего дня в часовом поясе Europe/Kyiv
 * @returns Date объект с временем 23:59:59.999 текущего дня в киевском времени
 */
export function getEndOfTodayKyiv(): Date {
  const now = new Date();
  
  // Получаем дату в киевском времени (YYYY-MM-DD)
  const todayKyiv = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Kyiv' });
  const [year, month, day] = todayKyiv.split('-').map(Number);
  
  // Вычисляем смещение киевского часового пояса от UTC
  // Создаем дату полудня в UTC для текущего дня
  const utcNoon = Date.UTC(year, month - 1, day, 12, 0, 0);
  
  // Форматируем эту дату в киевском времени
  const kyivNoonParts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Kyiv',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date(utcNoon));
  
  const kyivHour = parseInt(kyivNoonParts.find(p => p.type === 'hour')!.value);
  
  // Смещение: если в UTC 12:00, а в Киеве kyivHour:00
  // То смещение = kyivHour - 12 (обычно 2 или 3 часа)
  const offsetHours = kyivHour - 12;
  
  // Создаем конец дня (23:59:59.999) в киевском времени
  // В UTC это будет (23 - offsetHours):59:59.999
  const endOfDayUTC = new Date(Date.UTC(year, month - 1, day, 23 - offsetHours, 59, 59, 999));
  
  return endOfDayUTC;
}
