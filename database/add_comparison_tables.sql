-- Таблицы для управления таблицей сравнения товаров

-- Параметры сравнения (строки таблицы)
CREATE TABLE IF NOT EXISTS comparison_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Значения параметров для каждого товара
CREATE TABLE IF NOT EXISTS comparison_values (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feature_key VARCHAR(50) NOT NULL,
  product_id INT NOT NULL,
  value TEXT NULL,
  is_boolean BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY idx_feature_product (feature_key, product_id),
  INDEX idx_feature_key (feature_key),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Заполнение начальными данными параметров
INSERT INTO comparison_features (key_name, label, sort_order) VALUES
('colors', 'Кількість кольорів фетру', 0),
('size', 'Розмір листів фетру', 1),
('tools', 'Інструменти', 2),
('templates', 'Шаблони', 3),
('video', 'Відео-інструкції', 4),
('furniture', 'Фурнітура', 5),
('filler', 'Наповнювач', 6),
('consultation', 'Консультація майстра', 7),
('gift', 'Подарункова упаковка', 8),
('suitable', 'Рекомендовано для', 9)
ON DUPLICATE KEY UPDATE label=VALUES(label), sort_order=VALUES(sort_order);

-- Заполнение начальными значениями для товаров (используем product_id = 1, 2, 3)
INSERT INTO comparison_values (feature_key, product_id, value, is_boolean) VALUES
-- Стартовый набор (product_id = 1)
('colors', 1, '10 кольорів', FALSE),
('size', 1, '15×15 см', FALSE),
('tools', 1, 'Базовий набір', FALSE),
('templates', 1, '5 шаблонів', FALSE),
('video', 1, NULL, TRUE),
('furniture', 1, NULL, TRUE),
('filler', 1, NULL, TRUE),
('consultation', 1, NULL, TRUE),
('gift', 1, NULL, TRUE),
('suitable', 1, 'Діти 3+, початківці', FALSE),
-- Оптимальный набор (product_id = 2)
('colors', 2, '20 кольорів', FALSE),
('size', 2, '20×20 см', FALSE),
('tools', 2, 'Повний набір', FALSE),
('templates', 2, '20+ шаблонів', FALSE),
('video', 2, 'true', TRUE),
('furniture', 2, 'true', TRUE),
('filler', 2, 'true', TRUE),
('consultation', 2, NULL, TRUE),
('gift', 2, NULL, TRUE),
('suitable', 2, 'Вся родина, садок, школа', FALSE),
-- Преміум набор (product_id = 3)
('colors', 3, '40 кольорів', FALSE),
('size', 3, '30×30 см', FALSE),
('tools', 3, 'Професійні', FALSE),
('templates', 3, '50+ шаблонів', FALSE),
('video', 3, 'true', TRUE),
('furniture', 3, 'true', TRUE),
('filler', 3, 'true', TRUE),
('consultation', 3, 'true', TRUE),
('gift', 3, 'true', TRUE),
('suitable', 3, 'Професіонали, ентузіасти', FALSE)
ON DUPLICATE KEY UPDATE value=VALUES(value), is_boolean=VALUES(is_boolean);


