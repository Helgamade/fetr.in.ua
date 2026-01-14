-- Создание правильной структуры таблиц для материалов
-- Дата: 2025-01-14
-- Описание: Создает таблицу materials (материалы) и таблицу product_materials (связь many-to-many)
-- ВАЖНО: Убедитесь, что таблица products уже создана и использует InnoDB!

-- Шаг 1: Удаляем старую таблицу product_materials, если она существует
DROP TABLE IF EXISTS product_materials;

-- Шаг 2: Создание таблицы materials (материалы)
CREATE TABLE materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image VARCHAR(500) NULL,
  thumbnail VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Шаг 3: Создание таблицы product_materials БЕЗ внешних ключей (сначала создаем структуру)
CREATE TABLE product_materials (
  product_id VARCHAR(50) NOT NULL,
  material_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, material_id),
  INDEX idx_product_id (product_id),
  INDEX idx_material_id (material_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Шаг 4: Добавление внешних ключей отдельными командами (опционально)
-- Если внешние ключи не нужны, можно пропустить этот шаг
-- Раскомментируйте следующие строки, если хотите добавить внешние ключи:

-- ALTER TABLE product_materials 
--   ADD CONSTRAINT fk_product_materials_product 
--   FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- ALTER TABLE product_materials 
--   ADD CONSTRAINT fk_product_materials_material 
--   FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE;
