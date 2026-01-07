-- Migration 009: Add Authentication and Security Features
-- Adds support for Google OAuth, user sessions, and security measures

-- Add OAuth and login tracking fields to users table
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) NULL UNIQUE,
ADD COLUMN avatar_url VARCHAR(500) NULL,
ADD COLUMN last_login TIMESTAMP NULL,
ADD COLUMN is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD INDEX idx_google_id (google_id);

-- Add user_id to orders table for linking authenticated users
ALTER TABLE orders
ADD COLUMN user_id INT NULL,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
ADD INDEX idx_user_id (user_id);

-- Table for user access to materials (videos, templates, etc.)
CREATE TABLE IF NOT EXISTS user_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_id INT NULL,
  access_type ENUM('video', 'template', 'material', 'course') NOT NULL,
  access_key VARCHAR(255) NOT NULL,
  product_code VARCHAR(50) NULL,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_access_key (access_key),
  INDEX idx_product_code (product_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  refresh_token VARCHAR(255) NULL UNIQUE,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_token (session_token),
  INDEX idx_refresh_token (refresh_token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for tracking login attempts (protection against brute force)
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NULL,
  ip_address VARCHAR(45) NOT NULL,
  attempt_type ENUM('login', 'admin_login', 'api_access') NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason VARCHAR(255) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_ip_address (ip_address),
  INDEX idx_created_at (created_at),
  INDEX idx_attempt_type (attempt_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for IP blocking (temporary blocks for suspicious activity)
CREATE TABLE IF NOT EXISTS blocked_ips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  reason VARCHAR(255) NOT NULL,
  blocked_until TIMESTAMP NOT NULL,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_address (ip_address),
  INDEX idx_blocked_until (blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for admin activity logging
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NULL,
  entity_id VARCHAR(100) NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add setting for admin IP whitelist (optional)
INSERT INTO settings (key_name, value, type, description)
VALUES 
  ('admin_ip_whitelist', '[]', 'json', 'Список IP адресів з доступом до адмін панелі (порожній = всі)'),
  ('max_login_attempts', '5', 'number', 'Максимальна кількість спроб входу за хвилину'),
  ('login_block_duration', '3600', 'number', 'Тривалість блокування IP після невдалих спроб (секунди)'),
  ('session_duration', '900', 'number', 'Тривалість сесії в секундах (15 хвилин)'),
  ('refresh_token_duration', '604800', 'number', 'Тривалість refresh token в секундах (7 днів)')
ON DUPLICATE KEY UPDATE 
  value = VALUES(value), 
  type = VALUES(type), 
  description = VALUES(description);

