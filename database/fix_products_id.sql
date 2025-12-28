-- Исправление: добавление автоинкрементного id в таблицу products
-- Если поле id уже существует, но не AUTO_INCREMENT

-- Вариант 1: Если поле id существует, но не AUTO_INCREMENT
-- Сначала проверим структуру, потом выполним нужный вариант

-- Проверка: есть ли поле id?
-- SELECT COLUMN_NAME, COLUMN_TYPE, EXTRA FROM information_schema.COLUMNS 
-- WHERE TABLE_SCHEMA = 'idesig02_fetrinua' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'id';

-- Если поле id существует, но не AUTO_INCREMENT:
-- 1. Удаляем PRIMARY KEY если он на id
-- 2. Добавляем новое поле new_id с AUTO_INCREMENT
-- 3. Заполняем new_id значениями
-- 4. Удаляем старое поле id
-- 5. Переименовываем new_id в id

-- Если поле id НЕ существует:
-- Просто добавляем его как AUTO_INCREMENT PRIMARY KEY

-- Универсальный вариант:
-- 1. Проверяем, есть ли поле id
-- 2. Если есть - удаляем его и PRIMARY KEY
-- 3. Добавляем новое поле id с AUTO_INCREMENT PRIMARY KEY

-- Удаляем PRIMARY KEY если он существует
ALTER TABLE products DROP PRIMARY KEY;

-- Добавляем автоинкрементный id как PRIMARY KEY (FIRST - в начало таблицы)
ALTER TABLE products ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Если поле id уже существует, нужно сначала его удалить:
-- ALTER TABLE products DROP COLUMN id;
-- ALTER TABLE products ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;


