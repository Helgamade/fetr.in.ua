// Client-side sanitization utilities

/**
 * Sanitize string input - remove HTML tags and dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize name field (more strict - only letters, spaces, hyphens, apostrophes)
 */
export function sanitizeName(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Only allow letters, spaces, hyphens, apostrophes, and common Ukrainian characters
  let sanitized = input.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'-]/g, '');
  
  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Trim and limit length
  sanitized = sanitized.trim();
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized;
}

/**
 * Validate rating (1-5)
 */
export function validateRating(rating: number | null | undefined): number | null {
  if (rating === null || rating === undefined) {
    return null;
  }
  
  const num = typeof rating === 'number' ? rating : parseInt(String(rating), 10);
  if (isNaN(num) || num < 1 || num > 5) {
    return null;
  }
  
  return num;
}

