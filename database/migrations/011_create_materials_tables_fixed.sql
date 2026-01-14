-- Миграция: создание таблиц materials и product_materials (исправленная версия)
-- Дата: 2025-01-14
-- Описание: Создает отдельную таблицу для материалов с поддержкой изображений
--           и связь many-to-many между товарами и материалами
-- ВАЖНО: Таблица materials должна быть создана ПЕРЕД product_materials

-- Шаг 1: Создание таблицы materials (если не существует)
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

-- Шаг 2: Создание таблицы product_materials (если не существует)
-- ВАЖНО: Внешние ключи будут добавлены только если обе таблицы (products и materials) существуют
CREATE TABLE IF NOT EXISTS product_materials (
  product_id VARCHAR(50) NOT NULL,
  material_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, material_id),
  INDEX idx_product_id (product_id),
  INDEX idx_material_id (material_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Шаг 3: Добавление внешних ключей (если они еще не существуют)
-- Проверяем, существует ли внешний ключ для product_id
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME = 'product_materials'
  AND CONSTRAINT_NAME = 'product_materials_ibfk_1'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE product_materials ADD CONSTRAINT product_materials_ibfk_1 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE',
  'SELECT "Foreign key product_materials_ibfk_1 already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Проверяем, существует ли внешний ключ для material_id
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME = 'product_materials'
  AND CONSTRAINT_NAME = 'product_materials_ibfk_2'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE product_materials ADD CONSTRAINT product_materials_ibfk_2 FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE',
  'SELECT "Foreign key product_materials_ibfk_2 already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
