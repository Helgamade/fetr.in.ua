-- Упрощенная версия: пересоздание таблицы products
-- ВЫПОЛНЯТЬ ПОШАГОВО в phpMyAdmin!

-- ============================================
-- ШАГ 1: Удалите внешние ключи вручную через интерфейс phpMyAdmin
-- или выполните (замените имена ключей на реальные):
-- ============================================
-- ALTER TABLE product_images DROP FOREIGN KEY имя_ключа;
-- ALTER TABLE product_features DROP FOREIGN KEY имя_ключа;
-- ALTER TABLE product_product_options DROP FOREIGN KEY имя_ключа;
-- ALTER TABLE order_items DROP FOREIGN KEY имя_ключа;

-- ============================================
-- ШАГ 2: Создайте временную таблицу с данными
-- ============================================
CREATE TABLE products_backup AS SELECT * FROM products;

-- ============================================
-- ШАГ 3: Удалите старую таблицу
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
  INDEX `idx_badge` (`badge`),
  INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ШАГ 5: Вставьте данные из backup (id будет автоинкрементироваться)
-- ============================================
INSERT INTO `products` (`code`, `name`, `slug`, `short_description`, `full_description`, `base_price`, `sale_price`, `badge`, `stock`, `view_count`, `purchase_count`, `display_order`, `created_at`, `updated_at`)
SELECT `code`, `name`, `slug`, `short_description`, `full_description`, `base_price`, `sale_price`, `badge`, `stock`, `view_count`, `purchase_count`, `display_order`, `created_at`, `updated_at`
FROM products_backup
ORDER BY display_order;

-- ============================================
-- ШАГ 6: Проверка результата
-- ============================================
SELECT id, code, name, display_order FROM products ORDER BY id;
-- Должны увидеть: id (1, 2, 3), code (starter, optimal, premium)

-- ============================================
-- ШАГ 7: Обновите связанные таблицы
-- ============================================
-- Сначала нужно изменить типы колонок product_id с VARCHAR на INT во всех связанных таблицах
-- Это нужно сделать через ALTER TABLE ... MODIFY COLUMN

-- После этого обновите данные:
UPDATE product_images pi 
INNER JOIN products p ON pi.product_id = p.code 
SET pi.product_id = p.id;

UPDATE product_features pf 
INNER JOIN products p ON pf.product_id = p.code 
SET pf.product_id = p.id;

UPDATE product_product_options ppo 
INNER JOIN products p ON ppo.product_id = p.code 
SET ppo.product_id = p.id;

UPDATE order_items oi 
INNER JOIN products p ON oi.product_id = p.code 
SET oi.product_id = p.id;

-- ============================================
-- ШАГ 8: Удалите backup таблицу
-- ============================================
DROP TABLE products_backup;

-- ============================================
-- ШАГ 9: Восстановите внешние ключи
-- ============================================
-- ALTER TABLE product_images ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
-- ALTER TABLE product_features ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
-- ALTER TABLE product_product_options ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
-- ALTER TABLE order_items ADD FOREIGN KEY (product_id) REFERENCES products(id);


