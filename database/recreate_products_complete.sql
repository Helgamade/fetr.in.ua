-- Полное пересоздание таблицы products с обновлением всех связанных таблиц
-- ВЫПОЛНЯТЬ В phpMyAdmin ПОШАГОВО!

-- ============================================
-- ШАГ 1: Создайте backup таблицы
-- ============================================
CREATE TABLE products_backup AS SELECT * FROM products;

-- ============================================
-- ШАГ 2: Обновите связанные таблицы - переключите на code
-- ============================================

-- 2.1. product_images - добавить product_code
ALTER TABLE product_images ADD COLUMN product_code VARCHAR(50) NULL AFTER id;
UPDATE product_images pi INNER JOIN products p ON pi.product_id = p.id SET pi.product_code = p.code;
-- Удалите внешний ключ (найдите имя через SHOW CREATE TABLE product_images)
-- ALTER TABLE product_images DROP FOREIGN KEY имя_ключа;
ALTER TABLE product_images DROP COLUMN product_id;
ALTER TABLE product_images MODIFY COLUMN product_code VARCHAR(50) NOT NULL;

-- 2.2. product_features
ALTER TABLE product_features ADD COLUMN product_code VARCHAR(50) NULL AFTER id;
UPDATE product_features pf INNER JOIN products p ON pf.product_id = p.id SET pf.product_code = p.code;
-- ALTER TABLE product_features DROP FOREIGN KEY имя_ключа;
ALTER TABLE product_features DROP COLUMN product_id;
ALTER TABLE product_features MODIFY COLUMN product_code VARCHAR(50) NOT NULL;

-- 2.3. product_product_options
ALTER TABLE product_product_options ADD COLUMN product_code VARCHAR(50) NULL FIRST;
UPDATE product_product_options ppo INNER JOIN products p ON ppo.product_id = p.id SET ppo.product_code = p.code;
-- ALTER TABLE product_product_options DROP FOREIGN KEY имя_ключа;
ALTER TABLE product_product_options DROP COLUMN product_id;
ALTER TABLE product_product_options MODIFY COLUMN product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_code, option_id);

-- 2.4. order_items
ALTER TABLE order_items ADD COLUMN product_code VARCHAR(50) NULL AFTER order_id;
UPDATE order_items oi INNER JOIN products p ON oi.product_id = p.id SET oi.product_code = p.code;
-- ALTER TABLE order_items DROP FOREIGN KEY имя_ключа;
ALTER TABLE order_items DROP COLUMN product_id;
ALTER TABLE order_items MODIFY COLUMN product_code VARCHAR(50) NOT NULL;

-- ============================================
-- ШАГ 3: Удалите старую таблицу products
-- ============================================
DROP TABLE products;

-- ============================================
-- ШАГ 4: Создайте новую таблицу с правильной структурой
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
  INDEX `idx_badge` (`badge`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ШАГ 5: Вставьте данные из backup
-- ============================================
INSERT INTO `products` (`code`, `name`, `slug`, `short_description`, `full_description`, `base_price`, `sale_price`, `badge`, `stock`, `view_count`, `purchase_count`, `display_order`, `created_at`, `updated_at`)
SELECT `code`, `name`, `slug`, `short_description`, `full_description`, `base_price`, `sale_price`, `badge`, `stock`, `view_count`, `purchase_count`, `display_order`, `created_at`, `updated_at`
FROM products_backup
ORDER BY display_order;

-- ============================================
-- ШАГ 6: Проверка
-- ============================================
SELECT id, code, name, display_order FROM products ORDER BY id;
-- Должны увидеть: id (1, 2, 3), code (starter, optimal, premium)

-- ============================================
-- ШАГ 7: Верните связанные таблицы обратно на INT id
-- ============================================

-- 7.1. product_images
ALTER TABLE product_images ADD COLUMN product_id INT NULL AFTER id;
UPDATE product_images pi INNER JOIN products p ON pi.product_code = p.code SET pi.product_id = p.id;
ALTER TABLE product_images DROP COLUMN product_code;
ALTER TABLE product_images MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE product_images ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 7.2. product_features
ALTER TABLE product_features ADD COLUMN product_id INT NULL AFTER id;
UPDATE product_features pf INNER JOIN products p ON pf.product_code = p.code SET pf.product_id = p.id;
ALTER TABLE product_features DROP COLUMN product_code;
ALTER TABLE product_features MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE product_features ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 7.3. product_product_options
ALTER TABLE product_product_options ADD COLUMN product_id INT NULL FIRST;
UPDATE product_product_options ppo INNER JOIN products p ON ppo.product_code = p.code SET ppo.product_id = p.id;
ALTER TABLE product_product_options DROP COLUMN product_code;
ALTER TABLE product_product_options MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_id, option_id);
ALTER TABLE product_product_options ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 7.4. order_items
ALTER TABLE order_items ADD COLUMN product_id INT NULL AFTER order_id;
UPDATE order_items oi INNER JOIN products p ON oi.product_code = p.code SET oi.product_id = p.id;
ALTER TABLE order_items DROP COLUMN product_code;
ALTER TABLE order_items MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (product_id) REFERENCES products(id);

-- ============================================
-- ШАГ 8: Удалите backup
-- ============================================
DROP TABLE products_backup;


