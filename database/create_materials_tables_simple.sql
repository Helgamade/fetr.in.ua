-- Создание таблиц materials и product_materials (рабочая версия)
-- Дата: 2025-01-14
-- Описание: Создает отдельную таблицу для материалов с поддержкой изображений
--           и связь many-to-many между товарами и материалами
-- ВАЖНО: Убедитесь, что таблица products уже создана!

-- Шаг 1: Создание таблицы materials
CREATE TABLE IF NOT EXISTS materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image VARCHAR(500) NULL,
  thumbnail VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Шаг 2: Удаляем таблицу product_materials, если она существует (для пересоздания с правильными ключами)
DROP TABLE IF EXISTS product_materials;

-- Шаг 3: Создание таблицы product_materials с внешними ключами
CREATE TABLE product_materials (
  product_id VARCHAR(50) NOT NULL,
  material_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, material_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_material_id (material_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
