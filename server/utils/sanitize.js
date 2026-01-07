// Sanitization and validation utilities for user input

/**
 * Sanitize string input - remove HTML tags and dangerous characters
 * @param {string} input - Input string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content (extra protection)
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
 * Sanitize name field (more strict)
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized name
 */
export function sanitizeName(input) {
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
 * @param {any} rating - Rating value
 * @returns {number|null} - Valid rating or null
 */
export function validateRating(rating) {
  if (rating === null || rating === undefined) {
    return null;
  }
  
  const num = parseInt(rating, 10);
  if (isNaN(num) || num < 1 || num > 5) {
    return null;
  }
  
  return num;
}

/**
 * Rate limiting check (simple in-memory implementation)
 * Note: For production, use Redis or similar
 */
const rateLimitStore = new Map();

export function checkRateLimit(ip, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const key = `review:${ip}`;
  
  const record = rateLimitStore.get(key);
  
  if (!record || now - record.firstRequest > windowMs) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Cleanup old rate limit entries periodically (отложенный запуск)
let sanitizeCleanupInterval = null;

export function startSanitizeCleanup() {
  if (sanitizeCleanupInterval) return; // Уже запущен
  
  sanitizeCleanupInterval = setInterval(() => {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    
    for (const [key, record] of rateLimitStore.entries()) {
      if (now - record.firstRequest > windowMs * 2) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60000); // Clean up every 5 minutes (было каждую минуту) для экономии ресурсов
}


