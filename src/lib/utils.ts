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

/**
 * Генерирует случайное число с гауссовым распределением
 * @param mean - среднее значение
 * @param stdDev - стандартное отклонение
 * @returns случайное число
 */
function randomGaussian(mean: number = 0, stdDev: number = 1): number {
  // Используем алгоритм Box-Muller для генерации нормального распределения
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Вычисляет количество просматривающих товар прямо сейчас
 * Основано на алгоритмах Amazon, Booking.com, Aliexpress
 * 
 * @param productId - ID товара (для стабильности генерации)
 * @param purchaseCount - количество продаж товара (для расчета популярности)
 * @returns количество просматривающих (1-15)
 */
export function getViewingNowCount(productId: number, purchaseCount: number): number {
  // Получаем текущий час в киевском времени
  const now = new Date();
  const kyivHour = parseInt(now.toLocaleString('en-US', { 
    timeZone: 'Europe/Kyiv',
    hour: '2-digit',
    hour12: false
  }));

  // 1. Базовое число просмотров на основе позиции по продажам
  // Товары с большим количеством продаж имеют выше базовое значение
  let baseViewers: number;
  if (purchaseCount >= 1500) {
    // 1-е место по продажам
    baseViewers = 10;
  } else if (purchaseCount >= 1200) {
    // 2-е место по продажам
    baseViewers = 8;
  } else if (purchaseCount >= 700) {
    // 3-е место по продажам
    baseViewers = 6;
  } else {
    // Меньше продаж - меньше базовое значение
    baseViewers = Math.max(3, Math.floor(purchaseCount / 100));
  }

  // 2. Временной множитель (синусоидальная функция)
  // Пик активности: 9:00-21:00, минимум: 00:00-07:00
  // Используем sin² для более плавных переходов
  const normalizedHour = (kyivHour + 24 - 6) % 24; // Сдвигаем так, чтобы 6:00 было началом роста
  const timeMultiplier = 0.15 + 0.85 * Math.pow(Math.sin((Math.PI * normalizedHour) / 15), 2);
  
  // Ограничения по времени суток
  let minViewers: number;
  let maxViewers: number;
  
  if (kyivHour >= 2 && kyivHour < 6) {
    // Глубокая ночь: 02:00-06:00 (разрешаем 0)
    minViewers = 0;
    maxViewers = 2;
  } else if (kyivHour >= 0 && kyivHour < 2) {
    // Ночь: 00:00-02:00
    minViewers = 1;
    maxViewers = 2;
  } else if (kyivHour >= 6 && kyivHour < 7) {
    // Раннее утро: 06:00-07:00
    minViewers = 1;
    maxViewers = 2;
  } else if (kyivHour >= 7 && kyivHour < 9) {
    // Утро: 07:00-09:00 (растущая активность)
    minViewers = 1;
    maxViewers = 8;
  } else if (kyivHour >= 9 && kyivHour < 21) {
    // День: 09:00-21:00 (пик активности)
    minViewers = 3;
    maxViewers = 15;
  } else {
    // Вечер-ночь: 21:00-00:00 (спадающая активность)
    minViewers = 1;
    maxViewers = 8;
  }

  // 3. Множитель популярности (логарифмическая функция)
  const popularityMultiplier = 0.8 + 0.4 * (Math.log10(Math.max(100, purchaseCount) / 100) / Math.log10(16));
  
  // 4. Случайная вариация (детерминированная на основе productId для стабильности)
  // Используем productId как seed для стабильности в рамках часа
  const seed = productId + Math.floor(now.getTime() / (1000 * 60 * 60)); // Обновляется каждый час
  // Простая детерминированная псевдослучайная генерация на основе seed
  const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
  const randomVariation = (pseudoRandom - 0.5) * 2; // -1 до 1
  
  // 5. Итоговый расчет
  let viewingCount = baseViewers * timeMultiplier * popularityMultiplier + randomVariation;
  
  // 6. Округляем и применяем ограничения
  viewingCount = Math.round(viewingCount);
  viewingCount = Math.max(minViewers, Math.min(maxViewers, viewingCount));
  
  // 7. Гарантируем уникальность для разных товаров
  // Используем productId для создания смещения, которое гарантирует разные значения
  // Это важно для того, чтобы все 3 товара не имели одинаковых показателей
  // Используем смещение на основе остатка от деления productId, чтобы создать различия
  const idOffset = ((productId % 3) - 1) * 1.5; // -1.5, 0, или 1.5 для трех товаров
  viewingCount = viewingCount + idOffset;
  
  // Округляем после добавления смещения
  viewingCount = Math.round(viewingCount);
  
  // Применяем границы
  viewingCount = Math.max(minViewers, Math.min(maxViewers, viewingCount));
  
  // Если получился 0, но это не период 02:00-06:00, делаем минимум 1
  if (viewingCount === 0 && !(kyivHour >= 2 && kyivHour < 6)) {
    viewingCount = 1;
  }
  
  return viewingCount;
}
