-- Таблица для визитов (сессий)
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INT NULL,
  visitor_fingerprint VARCHAR(255) NOT NULL,
  
  -- Информация о визите
  first_visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_online BOOLEAN DEFAULT true,
  
  -- Источник трафика
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  referrer TEXT,
  landing_page VARCHAR(500),
  
  -- Технические данные
  device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
  browser VARCHAR(100),
  os VARCHAR(100),
  screen_resolution VARCHAR(50),
  language VARCHAR(10),
  ip_address VARCHAR(45),
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Статистика сессии
  pages_viewed INT DEFAULT 0,
  total_time_spent INT DEFAULT 0, -- в секундах
  cart_items_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_online (is_online),
  INDEX idx_created_at (created_at),
  INDEX idx_utm_source (utm_source),
  INDEX idx_utm_campaign (utm_campaign),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица для просмотров страниц
CREATE TABLE IF NOT EXISTS analytics_page_views (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  
  -- Информация о странице
  page_url VARCHAR(500) NOT NULL,
  page_title VARCHAR(255),
  page_type VARCHAR(50), -- home, product, category, checkout, etc.
  product_id INT NULL,
  
  -- Время на странице
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  time_spent INT DEFAULT 0, -- в секундах
  
  -- Взаимодействие
  scroll_depth INT DEFAULT 0, -- процент прокрутки
  clicks_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_session_id (session_id),
  INDEX idx_page_type (page_type),
  INDEX idx_product_id (product_id),
  INDEX idx_entered_at (entered_at),
  FOREIGN KEY (session_id) REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица для событий (воронка продаж и другие действия)
CREATE TABLE IF NOT EXISTS analytics_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  user_id INT NULL,
  
  -- Тип события
  event_type VARCHAR(100) NOT NULL, -- page_view, product_view, add_to_cart, checkout_start, etc.
  event_category VARCHAR(50), -- engagement, ecommerce, form, etc.
  event_label VARCHAR(255),
  
  -- Данные события (JSON)
  event_data JSON,
  
  -- Связь с продуктами/заказами
  product_id INT NULL,
  order_id VARCHAR(50) NULL,
  
  -- Значение события
  event_value DECIMAL(10,2) NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_event_category (event_category),
  INDEX idx_product_id (product_id),
  INDEX idx_order_id (order_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (session_id) REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_number) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица для воронки продаж
CREATE TABLE IF NOT EXISTS analytics_funnel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  user_id INT NULL,
  order_id VARCHAR(50) NULL,
  
  -- Этапы воронки (времена перехода)
  visited_site_at TIMESTAMP NULL,
  viewed_product_at TIMESTAMP NULL,
  added_to_cart_at TIMESTAMP NULL,
  started_checkout_at TIMESTAMP NULL,
  filled_name_at TIMESTAMP NULL,
  filled_phone_at TIMESTAMP NULL,
  selected_delivery_at TIMESTAMP NULL,
  filled_delivery_at TIMESTAMP NULL,
  selected_payment_at TIMESTAMP NULL,
  clicked_submit_at TIMESTAMP NULL,
  completed_order_at TIMESTAMP NULL,
  paid_order_at TIMESTAMP NULL,
  
  -- Продукты в корзине на момент checkout
  cart_products JSON,
  cart_total DECIMAL(10,2),
  
  -- Причина отказа (если не завершил)
  drop_stage VARCHAR(50), -- На каком этапе отвалился
  drop_reason VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_order_id (order_id),
  INDEX idx_drop_stage (drop_stage),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (session_id) REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_number) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица для хранения настроек аналитики
CREATE TABLE IF NOT EXISTS analytics_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Вставка начальных настроек
INSERT INTO analytics_settings (setting_key, setting_value) VALUES
('google_analytics_id', ''),
('google_ads_id', ''),
('google_tag_manager_id', ''),
('facebook_pixel_id', ''),
('enable_realtime_tracking', 'true'),
('session_timeout_minutes', '30')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

