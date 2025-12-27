-- Пошаговая миграция для добавления автоинкрементного id в products
-- ВЫПОЛНЯТЬ ПОШАГОВО! После каждого шага проверяйте результат.

-- ============================================
-- ШАГ 1: Проверка текущего состояния
-- ============================================
-- SELECT id, code, name FROM products;

-- ============================================
-- ШАГ 2: Обновление product_images (используем code вместо id)
-- ============================================
-- Сначала удаляем внешний ключ (найдите актуальное имя через SHOW CREATE TABLE product_images):
-- ALTER TABLE product_images DROP FOREIGN KEY имя_ключа;

-- Добавляем новую колонку
ALTER TABLE product_images ADD COLUMN product_code VARCHAR(50) NULL AFTER id;

-- Заполняем данными
UPDATE product_images pi INNER JOIN products p ON pi.product_id = p.id SET pi.product_code = p.code;

-- Удаляем старую колонку и внешний ключ
ALTER TABLE product_images DROP FOREIGN KEY product_images_ibfk_1;
ALTER TABLE product_images DROP COLUMN product_id;

-- Делаем новую колонку NOT NULL и добавляем внешний ключ
ALTER TABLE product_images MODIFY COLUMN product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_images ADD FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE;

-- ============================================
-- ШАГ 3: Обновление product_features
-- ============================================
ALTER TABLE product_features ADD COLUMN product_code VARCHAR(50) NULL AFTER id;
UPDATE product_features pf INNER JOIN products p ON pf.product_id = p.id SET pf.product_code = p.code;
ALTER TABLE product_features DROP FOREIGN KEY product_features_ibfk_1;
ALTER TABLE product_features DROP COLUMN product_id;
ALTER TABLE product_features MODIFY COLUMN product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_features ADD FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE;

-- ============================================
-- ШАГ 4: Обновление product_product_options
-- ============================================
ALTER TABLE product_product_options ADD COLUMN product_code VARCHAR(50) NULL FIRST;
UPDATE product_product_options ppo INNER JOIN products p ON ppo.product_id = p.id SET ppo.product_code = p.code;
ALTER TABLE product_product_options DROP FOREIGN KEY product_product_options_ibfk_1;
ALTER TABLE product_product_options DROP COLUMN product_id;
ALTER TABLE product_product_options MODIFY COLUMN product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_code, option_id);
ALTER TABLE product_product_options ADD FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE;

-- ============================================
-- ШАГ 5: Обновление order_items
-- ============================================
ALTER TABLE order_items ADD COLUMN product_code VARCHAR(50) NULL AFTER order_id;
UPDATE order_items oi INNER JOIN products p ON oi.product_id = p.id SET oi.product_code = p.code;
ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;
ALTER TABLE order_items DROP COLUMN product_id;
ALTER TABLE order_items MODIFY COLUMN product_code VARCHAR(50) NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (product_code) REFERENCES products(code);

-- ============================================
-- ШАГ 6: Изменение структуры products
-- ============================================
ALTER TABLE products DROP PRIMARY KEY;
ALTER TABLE products DROP COLUMN id;
ALTER TABLE products ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Проверка: SELECT id, code, name FROM products;

-- ============================================
-- ШАГ 7: Возврат обратно на новый id
-- ============================================
-- 7.1. product_images
ALTER TABLE product_images DROP FOREIGN KEY product_images_ibfk_1;
ALTER TABLE product_images ADD COLUMN product_id INT NULL AFTER id;
UPDATE product_images pi INNER JOIN products p ON pi.product_code = p.code SET pi.product_id = p.id;
ALTER TABLE product_images DROP COLUMN product_code;
ALTER TABLE product_images MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE product_images ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 7.2. product_features
ALTER TABLE product_features DROP FOREIGN KEY product_features_ibfk_1;
ALTER TABLE product_features ADD COLUMN product_id INT NULL AFTER id;
UPDATE product_features pf INNER JOIN products p ON pf.product_code = p.code SET pf.product_id = p.id;
ALTER TABLE product_features DROP COLUMN product_code;
ALTER TABLE product_features MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE product_features ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 7.3. product_product_options
ALTER TABLE product_product_options DROP FOREIGN KEY product_product_options_ibfk_1;
ALTER TABLE product_product_options ADD COLUMN product_id INT NULL FIRST;
UPDATE product_product_options ppo INNER JOIN products p ON ppo.product_code = p.code SET ppo.product_id = p.id;
ALTER TABLE product_product_options DROP COLUMN product_code;
ALTER TABLE product_product_options MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_id, option_id);
ALTER TABLE product_product_options ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 7.4. order_items
ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;
ALTER TABLE order_items ADD COLUMN product_id INT NULL AFTER order_id;
UPDATE order_items oi INNER JOIN products p ON oi.product_code = p.code SET oi.product_id = p.id;
ALTER TABLE order_items DROP COLUMN product_code;
ALTER TABLE order_items MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (product_id) REFERENCES products(id);

-- Финальная проверка: SELECT id, code, name FROM products;

