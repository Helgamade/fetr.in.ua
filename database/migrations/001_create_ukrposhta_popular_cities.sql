-- Таблица популярных городов Укрпошты
-- CITY_ID обновляется по крону ежедневно
CREATE TABLE IF NOT EXISTS ukrposhta_popular_cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(255) NOT NULL,
  city_id VARCHAR(50) NULL, -- Числовой CITY_ID из API Укрпошты (обновляется по крону)
  postal_code VARCHAR(20) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMP NULL, -- Когда последний раз обновлялся CITY_ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_city_id (city_id),
  INDEX idx_sort_order (sort_order),
  UNIQUE KEY unique_name_region (name, region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Начальные данные (CITY_ID будет обновлен скриптом)
INSERT INTO ukrposhta_popular_cities (name, region, sort_order) VALUES
('Київ', 'Київська', 1),
('Одеса', 'Одеська', 2),
('Дніпро', 'Дніпропетровська', 3),
('Харків', 'Харківська', 4),
('Львів', 'Львівська', 5),
('Запоріжжя', 'Запорізька', 6)
ON DUPLICATE KEY UPDATE name=name;

