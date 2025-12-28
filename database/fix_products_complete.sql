-- Полная миграция для добавления автоинкрементного id в products
-- С учетом всех внешних ключей

-- ШАГ 1: Обновляем таблицы, которые ссылаются на products.id
-- Временно изменяем их, чтобы они ссылались на products.code

-- 1.1. product_images
ALTER TABLE product_images DROP FOREIGN KEY product_images_ibfk_1;
ALTER TABLE product_images ADD COLUMN product_code VARCHAR(50) NULL;
UPDATE product_images pi INNER JOIN products p ON pi.product_id = p.id SET pi.product_code = p.code;
ALTER TABLE product_images DROP COLUMN product_id;
ALTER TABLE product_images CHANGE COLUMN product_code product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_images ADD FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE;

-- 1.2. product_features
ALTER TABLE product_features DROP FOREIGN KEY product_features_ibfk_1;
ALTER TABLE product_features ADD COLUMN product_code VARCHAR(50) NULL;
UPDATE product_features pf INNER JOIN products p ON pf.product_id = p.id SET pf.product_code = p.code;
ALTER TABLE product_features DROP COLUMN product_id;
ALTER TABLE product_features CHANGE COLUMN product_code product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_features ADD FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE;

-- 1.3. product_product_options
ALTER TABLE product_product_options DROP FOREIGN KEY product_product_options_ibfk_1;
ALTER TABLE product_product_options ADD COLUMN product_code VARCHAR(50) NULL;
UPDATE product_product_options ppo INNER JOIN products p ON ppo.product_id = p.id SET ppo.product_code = p.code;
ALTER TABLE product_product_options DROP COLUMN product_id;
ALTER TABLE product_product_options CHANGE COLUMN product_code product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_code, option_id);
ALTER TABLE product_product_options ADD FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE;

-- 1.4. order_items
ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;
ALTER TABLE order_items ADD COLUMN product_code VARCHAR(50) NULL;
UPDATE order_items oi INNER JOIN products p ON oi.product_id = p.id SET oi.product_code = p.code;
ALTER TABLE order_items DROP COLUMN product_id;
ALTER TABLE order_items CHANGE COLUMN product_code product_code VARCHAR(50) NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (product_code) REFERENCES products(code);

-- ШАГ 2: Изменяем структуру products
ALTER TABLE products DROP PRIMARY KEY;
ALTER TABLE products DROP COLUMN id;
ALTER TABLE products ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- ШАГ 3: Обновляем таблицы обратно, чтобы они ссылались на новый id
-- 3.1. product_images
ALTER TABLE product_images DROP FOREIGN KEY product_images_ibfk_1;
ALTER TABLE product_images ADD COLUMN product_id INT NULL;
UPDATE product_images pi INNER JOIN products p ON pi.product_code = p.code SET pi.product_id = p.id;
ALTER TABLE product_images DROP COLUMN product_code;
ALTER TABLE product_images CHANGE COLUMN product_id product_id INT NOT NULL;
ALTER TABLE product_images ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 3.2. product_features
ALTER TABLE product_features DROP FOREIGN KEY product_features_ibfk_1;
ALTER TABLE product_features ADD COLUMN product_id INT NULL;
UPDATE product_features pf INNER JOIN products p ON pf.product_code = p.code SET pf.product_id = p.id;
ALTER TABLE product_features DROP COLUMN product_code;
ALTER TABLE product_features CHANGE COLUMN product_id product_id INT NOT NULL;
ALTER TABLE product_features ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 3.3. product_product_options
ALTER TABLE product_product_options DROP FOREIGN KEY product_product_options_ibfk_1;
ALTER TABLE product_product_options ADD COLUMN product_id INT NULL;
UPDATE product_product_options ppo INNER JOIN products p ON ppo.product_code = p.code SET ppo.product_id = p.id;
ALTER TABLE product_product_options DROP COLUMN product_code;
ALTER TABLE product_product_options CHANGE COLUMN product_id product_id INT NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_id, option_id);
ALTER TABLE product_product_options ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 3.4. order_items
ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;
ALTER TABLE order_items ADD COLUMN product_id INT NULL;
UPDATE order_items oi INNER JOIN products p ON oi.product_code = p.code SET oi.product_id = p.id;
ALTER TABLE order_items DROP COLUMN product_code;
ALTER TABLE order_items CHANGE COLUMN product_id product_id INT NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (product_id) REFERENCES products(id);


