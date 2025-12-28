/**
 * Форматирует дату в относительное время на украинском языке
 * @param date - Дата для форматирования
 * @returns Строка типа "2 дня назад", "1 тиждень назад" и т.д.
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const reviewDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - reviewDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) {
        return 'щойно';
      }
      if (diffMinutes === 1) {
        return '1 хвилину тому';
      }
      if (diffMinutes < 5) {
        return `${diffMinutes} хвилини тому`;
      }
      return `${diffMinutes} хвилин тому`;
    }
    if (diffHours === 1) {
      return '1 годину тому';
    }
    if (diffHours < 5) {
      return `${diffHours} години тому`;
    }
    return `${diffHours} годин тому`;
  }

  if (diffDays === 1) {
    return 'вчора';
  }

  if (diffDays < 7) {
    return `${diffDays} ${getDaysDeclension(diffDays)} тому`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) {
    return '1 тиждень тому';
  }
  if (diffWeeks < 5) {
    return `${diffWeeks} тижні тому`;
  }
  return `${diffWeeks} тижнів тому`;

  // Если больше месяца, можно добавить месяцы и годы
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    if (diffMonths === 1) {
      return '1 місяць тому';
    }
    if (diffMonths < 5) {
      return `${diffMonths} місяці тому`;
    }
    return `${diffMonths} місяців тому`;
  }

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) {
    return '1 рік тому';
  }
  if (diffYears < 5) {
    return `${diffYears} роки тому`;
  }
  return `${diffYears} років тому`;
}

/**
 * Возвращает правильное склонение для слова "день" в украинском языке
 */
function getDaysDeclension(days: number): string {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дні';
  return 'днів';
}


