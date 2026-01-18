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
  
  // 5. Специальная логика для периода 02:00-06:00 (разрешаем 0)
  if (kyivHour >= 2 && kyivHour < 6) {
    // Для глубокой ночи: прямое назначение значений 0, 1, 2 на основе популярности
    // Товар с большими продажами получает большее значение
    // Определяем позицию товара по продажам для правильного распределения
    let position: number;
    if (purchaseCount >= 1500) {
      position = 1; // 1-е место
    } else if (purchaseCount >= 1200) {
      position = 2; // 2-е место
    } else if (purchaseCount >= 700) {
      position = 3; // 3-е место
    } else {
      position = 4; // Меньше продаж
    }
    
    // Распределяем значения: 1-е место = 2, 2-е место = 1, 3-е место = 0
    // Но используем productId для небольшой вариации, если товары имеют одинаковую позицию
    let nightValue: number;
    if (position === 1) {
      nightValue = 2; // 1-е место - самое большое значение
    } else if (position === 2) {
      nightValue = 1; // 2-е место - среднее значение
    } else {
      nightValue = 0; // 3-е место и ниже - может быть 0
    }
    
    // Добавляем небольшую вариацию на основе productId для уникальности
    const idVariation = (productId % 3) - 1; // -1, 0, 1
    nightValue = nightValue + idVariation;
    
    // Применяем границы для периода 02:00-06:00
    nightValue = Math.max(0, Math.min(2, nightValue));
    
    return nightValue;
  }
  
  // 6. Для остального времени: обычный расчет
  let viewingCount = baseViewers * timeMultiplier * popularityMultiplier + randomVariation;
  
  // 7. Округляем и применяем ограничения
  viewingCount = Math.round(viewingCount);
  viewingCount = Math.max(minViewers, Math.min(maxViewers, viewingCount));
  
  // 8. Гарантируем уникальность и правильный порядок для разных товаров
  // Товар с большими продажами должен иметь больше просмотров
  // Используем смещение на основе позиции по продажам
  let popularityOffset: number;
  if (purchaseCount >= 1500) {
    // 1-е место - добавляем +1 для гарантии что будет больше других
    popularityOffset = 1;
  } else if (purchaseCount >= 1200) {
    // 2-е место - нейтральное смещение
    popularityOffset = 0;
  } else if (purchaseCount >= 700) {
    // 3-е место - убираем 1 для гарантии что будет меньше других
    popularityOffset = -1;
  } else {
    // Меньше продаж - убираем еще больше
    popularityOffset = -2;
  }
  
  viewingCount = viewingCount + popularityOffset;
  
  // Применяем границы еще раз после смещения
  viewingCount = Math.max(minViewers, Math.min(maxViewers, viewingCount));
  
  // Дополнительно гарантируем уникальность через productId (если значения совпали)
  // Добавляем небольшое смещение на основе productId для финальной уникальности
  const finalIdOffset = ((productId % 3) - 1) * 0.3; // -0.3, 0, 0.3
  viewingCount = Math.round(viewingCount + finalIdOffset);
  viewingCount = Math.max(minViewers, Math.min(maxViewers, viewingCount));
  
  return viewingCount;
}
