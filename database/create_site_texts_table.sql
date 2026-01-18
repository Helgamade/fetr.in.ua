-- Таблица для хранения текстов сайта
-- Структура совместима с i18next (namespace.key)
CREATE TABLE IF NOT EXISTS site_texts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Формат: namespace.key (например, nav.home)',
  value TEXT NOT NULL,
  namespace VARCHAR(100) NOT NULL COMMENT 'Категория/namespace для группировки',
  description VARCHAR(500) COMMENT 'Описание для админ-панели',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_namespace (namespace),
  INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;






















