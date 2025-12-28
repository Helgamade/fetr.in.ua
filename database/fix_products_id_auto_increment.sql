-- Исправление: добавление автоинкрементного id в таблицу products
-- Текущая ситуация: id VARCHAR(50) PRIMARY KEY, code VARCHAR(50) UNIQUE

-- ШАГ 1: Удаляем PRIMARY KEY с поля id (но не удаляем само поле пока)
ALTER TABLE products DROP PRIMARY KEY;

-- ШАГ 2: Удаляем старое поле id (VARCHAR)
ALTER TABLE products DROP COLUMN id;

-- ШАГ 3: Добавляем новое поле id как INT AUTO_INCREMENT PRIMARY KEY в начало таблицы
ALTER TABLE products ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Проверка: SELECT * FROM products; - должно показать id с автоинкрементными значениями


