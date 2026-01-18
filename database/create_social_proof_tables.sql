-- Таблицы для модуля Social Proof уведомлений

-- Настройки модуля Social Proof
CREATE TABLE IF NOT EXISTS social_proof_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Список типов уведомлений
CREATE TABLE IF NOT EXISTS social_proof_notification_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL COMMENT 'viewing, purchased_today, purchased_local',
  name VARCHAR(255) NOT NULL COMMENT 'Название типа',
  template TEXT NOT NULL COMMENT 'Шаблон сообщения с переменными',
  is_enabled BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_is_enabled (is_enabled),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Список имен для уведомлений
CREATE TABLE IF NOT EXISTS social_proof_names (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Логи отправки уведомлений
CREATE TABLE IF NOT EXISTS social_proof_notifications_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL COMMENT 'ID сессии аналитики',
  visitor_fingerprint VARCHAR(255) NULL,
  notification_type VARCHAR(50) NOT NULL COMMENT 'viewing, purchased_today, purchased_local',
  product_id INT NULL,
  product_code VARCHAR(50) NULL,
  product_name VARCHAR(255) NULL,
  
  -- Персональные данные (для purchased_local)
  client_city_from_ip VARCHAR(100) NULL COMMENT 'Город определенный по IP',
  client_country_from_ip VARCHAR(100) NULL COMMENT 'Страна определенная по IP',
  client_latitude DECIMAL(10, 7) NULL COMMENT 'Широта из геолокации',
  client_longitude DECIMAL(10, 7) NULL COMMENT 'Долгота из геолокации',
  client_city_from_np VARCHAR(100) NULL COMMENT 'Город из базы Новой Почты',
  client_name VARCHAR(100) NULL COMMENT 'Имя из списка',
  hours_ago INT NULL COMMENT 'Сколько часов назад купила',
  
  -- Контент сообщения
  message_text TEXT NOT NULL COMMENT 'Точный текст отправленного сообщения',
  variables_used JSON NULL COMMENT 'Использованные переменные в JSON',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_session_id (session_id),
  INDEX idx_visitor_fingerprint (visitor_fingerprint),
  INDEX idx_notification_type (notification_type),
  INDEX idx_created_at (created_at),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Начальные данные для типов уведомлений
INSERT INTO social_proof_notification_types (code, name, template, is_enabled, sort_order) VALUES
('viewing', 'Переглядають', '{count} людей переглядають {product_name}', TRUE, 1),
('purchased_today', 'Купили сьогодні', '{count} людей купили сьогодні {product_name}', TRUE, 2),
('purchased_local', 'Купила в регіоні', '{name} ({city}) купила {hours_ago} тому {product_name}', TRUE, 3)
ON DUPLICATE KEY UPDATE name=VALUES(name), template=VALUES(template);

-- Начальные данные для имен
INSERT INTO social_proof_names (name, sort_order) VALUES
('Ольга', 1), ('Ірина', 2), ('Наталія', 3), ('Марія', 4), ('Вікторія', 5),
('Анастасія', 6), ('Олена', 7), ('Тетяна', 8), ('Юлія', 9), ('Катерина', 10),
('Анна', 11), ('Світлана', 12)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Начальные настройки
INSERT INTO social_proof_settings (setting_key, setting_value, setting_type, description) VALUES
('first_notification_delay', '60', 'number', 'Задержка первого уведомления в секундах'),
('notification_interval', '60', 'number', 'Минимальный интервал между уведомлениями в секундах'),
('notification_order', 'random', 'string', 'Порядок показа: sequential или random'),
('max_notifications_per_session', '10', 'number', 'Максимальное количество уведомлений за сессию')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value), description=VALUES(description);
