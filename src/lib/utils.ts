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
