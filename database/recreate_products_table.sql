-- Полное пересоздание таблицы products с автоинкрементным id
-- ВНИМАНИЕ: Это удалит таблицу products и пересоздаст её!
-- Убедитесь, что у вас есть резервная копия!

-- ============================================
-- ШАГ 1: Удаление всех внешних ключей, ссылающихся на products
-- ============================================

-- product_images
SET @constraint_name = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = 'idesig02_fetrinua' AND TABLE_NAME = 'product_images' 
  AND REFERENCED_TABLE_NAME = 'products' LIMIT 1);
SET @sql = IF(@constraint_name IS NOT NULL, 
  CONCAT('ALTER TABLE product_images DROP FOREIGN KEY ', @constraint_name), 
  'SELECT "No FK found in product_images"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- product_features
SET @constraint_name = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = 'idesig02_fetrinua' AND TABLE_NAME = 'product_features' 
  AND REFERENCED_TABLE_NAME = 'products' LIMIT 1);
SET @sql = IF(@constraint_name IS NOT NULL, 
  CONCAT('ALTER TABLE product_features DROP FOREIGN KEY ', @constraint_name), 
  'SELECT "No FK found in product_features"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- product_product_options
SET @constraint_name = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = 'idesig02_fetrinua' AND TABLE_NAME = 'product_product_options' 
  AND REFERENCED_TABLE_NAME = 'products' LIMIT 1);
SET @sql = IF(@constraint_name IS NOT NULL, 
  CONCAT('ALTER TABLE product_product_options DROP FOREIGN KEY ', @constraint_name), 
  'SELECT "No FK found in product_product_options"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- order_items
SET @constraint_name = (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = 'idesig02_fetrinua' AND TABLE_NAME = 'order_items' 
  AND REFERENCED_TABLE_NAME = 'products' LIMIT 1);
SET @sql = IF(@constraint_name IS NOT NULL, 
  CONCAT('ALTER TABLE order_items DROP FOREIGN KEY ', @constraint_name), 
  'SELECT "No FK found in order_items"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- ШАГ 2: Сохранение данных во временную таблицу
-- ============================================

CREATE TABLE products_temp AS SELECT * FROM products;

-- ============================================
-- ШАГ 3: Удаление старой таблицы products
-- ============================================

DROP TABLE products;

-- ============================================
-- ШАГ 4: Создание новой таблицы products с правильной структурой
-- ============================================

CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `short_description` TEXT NOT NULL,
  `full_description` TEXT NOT NULL,
  `base_price` DECIMAL(10,2) NOT NULL,
  `sale_price` DECIMAL(10,2) DEFAULT NULL,
  `badge` ENUM('hit','recommended','limited') DEFAULT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `view_count` INT NOT NULL DEFAULT 0,
  `purchase_count` INT NOT NULL DEFAULT 0,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slug` (`slug`),
  INDEX `idx_badge` (`badge`),
  INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ШАГ 5: Копирование данных из временной таблицы
-- ============================================

INSERT INTO `products` (`code`, `name`, `slug`, `short_description`, `full_description`, `base_price`, `sale_price`, `badge`, `stock`, `view_count`, `purchase_count`, `display_order`, `created_at`, `updated_at`)
SELECT `code`, `name`, `slug`, `short_description`, `full_description`, `base_price`, `sale_price`, `badge`, `stock`, `view_count`, `purchase_count`, `display_order`, `created_at`, `updated_at`
FROM products_temp
ORDER BY display_order;

-- ============================================
-- ШАГ 6: Удаление временной таблицы
-- ============================================

DROP TABLE products_temp;

-- ============================================
-- ШАГ 7: Обновление связанных таблиц для использования нового id
-- ============================================

-- 7.1. product_images - обновляем product_id на основе code
UPDATE product_images pi
INNER JOIN products p ON pi.product_id = p.code
SET pi.product_id = p.id;

-- Но сначала нужно изменить тип колонки product_id с VARCHAR на INT
-- Это можно сделать только если таблица пустая или после копирования данных
-- Если product_images уже имеет product_id как VARCHAR, нужно:
-- ALTER TABLE product_images MODIFY COLUMN product_id INT NOT NULL;
-- Затем обновить данные через JOIN с products по code

-- 7.2. product_features - аналогично
UPDATE product_features pf
INNER JOIN products p ON pf.product_id = p.code
SET pf.product_id = p.id;

-- 7.3. product_product_options - аналогично
UPDATE product_product_options ppo
INNER JOIN products p ON ppo.product_id = p.code
SET ppo.product_id = p.id;

-- 7.4. order_items - аналогично
UPDATE order_items oi
INNER JOIN products p ON oi.product_id = p.code
SET oi.product_id = p.id;

-- ============================================
-- ШАГ 8: Восстановление внешних ключей
-- ============================================

-- После изменения типов колонок на INT, восстановите внешние ключи:
-- ALTER TABLE product_images ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
-- ALTER TABLE product_features ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
-- ALTER TABLE product_product_options ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
-- ALTER TABLE order_items ADD FOREIGN KEY (product_id) REFERENCES products(id);

-- Проверка результата:
SELECT id, code, name, display_order FROM products ORDER BY id;


