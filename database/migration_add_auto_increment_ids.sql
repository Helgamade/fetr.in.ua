-- Миграция: Добавление автоинкрементных id в таблицы
-- Выполнять пошагово!

-- ============================================
-- ШАГ 1: Таблица orders
-- ============================================

-- 1.1. Добавляем поле order_number (для номера заказа)
ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) NULL;

-- 1.2. Копируем данные из id в order_number
UPDATE orders SET order_number = id;

-- 1.3. Делаем order_number NOT NULL и UNIQUE
ALTER TABLE orders MODIFY COLUMN order_number VARCHAR(50) NOT NULL;
ALTER TABLE orders ADD UNIQUE KEY idx_order_number (order_number);

-- 1.4. Удаляем старый PRIMARY KEY (на поле id, которое станет order_number)
ALTER TABLE orders DROP PRIMARY KEY;

-- 1.5. Добавляем автоинкрементный id (новый) как PRIMARY KEY
ALTER TABLE orders ADD COLUMN new_id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 1.6. Переименовываем new_id в id
ALTER TABLE orders CHANGE COLUMN new_id id INT AUTO_INCREMENT;

-- 1.6. Удаляем старый PRIMARY KEY на старом id (теперь это order_number)
-- Старое поле id теперь называется order_number, PRIMARY KEY уже на новом id

-- ============================================
-- ШАГ 2: Обновление order_items
-- ============================================

-- 2.1. Добавляем новое поле order_id (INT)
ALTER TABLE order_items ADD COLUMN order_id_new INT NULL;

-- 2.2. Заполняем order_id_new на основе order_number
UPDATE order_items oi
INNER JOIN orders o ON oi.order_id = o.order_number
SET oi.order_id_new = o.id;

-- 2.3. Удаляем старый внешний ключ (нужно узнать имя)
-- ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_1;

-- 2.4. Удаляем старое поле и переименовываем новое
ALTER TABLE order_items DROP COLUMN order_id;
ALTER TABLE order_items CHANGE COLUMN order_id_new order_id INT NOT NULL;

-- 2.5. Добавляем новый внешний ключ
ALTER TABLE order_items ADD FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE order_items ADD INDEX idx_order_id (order_id);

-- ============================================
-- ШАГ 3: Таблица products
-- ============================================

-- 3.1. Добавляем поле code
ALTER TABLE products ADD COLUMN code VARCHAR(50) NULL;

-- 3.2. Копируем данные
UPDATE products SET code = id;

-- 3.3. Делаем code NOT NULL и UNIQUE
ALTER TABLE products MODIFY COLUMN code VARCHAR(50) NOT NULL;
ALTER TABLE products ADD UNIQUE KEY idx_code (code);

-- 3.4. Удаляем старый PRIMARY KEY
ALTER TABLE products DROP PRIMARY KEY;

-- 3.5. Добавляем автоинкрементный id как PRIMARY KEY
ALTER TABLE products ADD COLUMN new_id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 3.6. Переименовываем
ALTER TABLE products CHANGE COLUMN new_id id INT AUTO_INCREMENT;

-- ============================================
-- ШАГ 4: Обновление таблиц, ссылающихся на products
-- ============================================

-- 4.1. product_images
ALTER TABLE product_images ADD COLUMN product_id_new INT NULL;
UPDATE product_images pi INNER JOIN products p ON pi.product_id = p.code SET pi.product_id_new = p.id;
ALTER TABLE product_images DROP FOREIGN KEY product_images_ibfk_1;
ALTER TABLE product_images DROP COLUMN product_id;
ALTER TABLE product_images CHANGE COLUMN product_id_new product_id INT NOT NULL;
ALTER TABLE product_images ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 4.2. product_features
ALTER TABLE product_features ADD COLUMN product_id_new INT NULL;
UPDATE product_features pf INNER JOIN products p ON pf.product_id = p.code SET pf.product_id_new = p.id;
ALTER TABLE product_features DROP FOREIGN KEY product_features_ibfk_1;
ALTER TABLE product_features DROP COLUMN product_id;
ALTER TABLE product_features CHANGE COLUMN product_id_new product_id INT NOT NULL;
ALTER TABLE product_features ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 4.3. product_product_options
ALTER TABLE product_product_options ADD COLUMN product_id_new INT NULL;
UPDATE product_product_options ppo INNER JOIN products p ON ppo.product_id = p.code SET ppo.product_id_new = p.id;
ALTER TABLE product_product_options DROP FOREIGN KEY product_product_options_ibfk_1;
ALTER TABLE product_product_options DROP COLUMN product_id;
ALTER TABLE product_product_options CHANGE COLUMN product_id_new product_id INT NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_id, option_id);
ALTER TABLE product_product_options ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 4.4. order_items
ALTER TABLE order_items ADD COLUMN product_id_new INT NULL;
UPDATE order_items oi INNER JOIN products p ON oi.product_id = p.code SET oi.product_id_new = p.id;
ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;
ALTER TABLE order_items DROP COLUMN product_id;
ALTER TABLE order_items CHANGE COLUMN product_id_new product_id INT NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (product_id) REFERENCES products(id);

-- ============================================
-- ШАГ 5: Таблица product_options
-- ============================================

-- 5.1. Добавляем поле code
ALTER TABLE product_options ADD COLUMN code VARCHAR(50) NULL;

-- 5.2. Копируем данные
UPDATE product_options SET code = id;

-- 5.3. Делаем code NOT NULL и UNIQUE
ALTER TABLE product_options MODIFY COLUMN code VARCHAR(50) NOT NULL;
ALTER TABLE product_options ADD UNIQUE KEY idx_code (code);

-- 5.4. Удаляем старый PRIMARY KEY
ALTER TABLE product_options DROP PRIMARY KEY;

-- 5.5. Добавляем автоинкрементный id как PRIMARY KEY
ALTER TABLE product_options ADD COLUMN new_id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 5.6. Переименовываем
ALTER TABLE product_options CHANGE COLUMN new_id id INT AUTO_INCREMENT;

-- ============================================
-- ШАГ 6: Обновление таблиц, ссылающихся на product_options
-- ============================================

-- 6.1. product_product_options
ALTER TABLE product_product_options ADD COLUMN option_id_new INT NULL;
UPDATE product_product_options ppo INNER JOIN product_options po ON ppo.option_id = po.code SET ppo.option_id_new = po.id;
ALTER TABLE product_product_options DROP FOREIGN KEY product_product_options_ibfk_2;
ALTER TABLE product_product_options DROP COLUMN option_id;
ALTER TABLE product_product_options CHANGE COLUMN option_id_new option_id INT NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_id, option_id);
ALTER TABLE product_product_options ADD FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE;

-- 6.2. order_item_options
ALTER TABLE order_item_options ADD COLUMN option_id_new INT NULL;
UPDATE order_item_options oio INNER JOIN product_options po ON oio.option_id = po.code SET oio.option_id_new = po.id;
ALTER TABLE order_item_options DROP FOREIGN KEY order_item_options_ibfk_2;
ALTER TABLE order_item_options DROP COLUMN option_id;
ALTER TABLE order_item_options CHANGE COLUMN option_id_new option_id INT NOT NULL;
ALTER TABLE order_item_options ADD FOREIGN KEY (option_id) REFERENCES product_options(id);

-- ============================================
-- ШАГ 7: Таблица product_product_options - добавляем автоинкрементный id
-- ============================================

ALTER TABLE product_product_options 
  ADD COLUMN id INT AUTO_INCREMENT FIRST,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (id),
  ADD UNIQUE KEY idx_product_option (product_id, option_id);
