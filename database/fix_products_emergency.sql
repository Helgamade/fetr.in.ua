-- ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ: Добавление PRIMARY KEY обратно
-- Если вы удалили PRIMARY KEY из products и не можете редактировать таблицу

-- Вариант 1: Если поле code уже существует и уникально
-- Добавьте PRIMARY KEY на code временно:
ALTER TABLE products ADD PRIMARY KEY (code);

-- Теперь можно продолжить миграцию:
-- 1. Удалите PRIMARY KEY снова
ALTER TABLE products DROP PRIMARY KEY;

-- 2. Удалите старое поле id (VARCHAR)
ALTER TABLE products DROP COLUMN id;

-- 3. Добавьте новое автоинкрементное id
ALTER TABLE products ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 4. Проверьте результат
SELECT id, code, name FROM products;

-- Если code еще не существует, сначала создайте его:
-- ALTER TABLE products ADD COLUMN code VARCHAR(50) NULL;
-- UPDATE products SET code = id;
-- ALTER TABLE products MODIFY COLUMN code VARCHAR(50) NOT NULL;
-- ALTER TABLE products ADD UNIQUE KEY idx_code (code);
-- ALTER TABLE products ADD PRIMARY KEY (code);

