-- Проверка текущего состояния таблицы products
-- Выполните эти команды, чтобы понять текущую структуру:

-- 1. Показать все ключи:
SHOW KEYS FROM products WHERE Key_name = 'PRIMARY';

-- 2. Показать структуру таблицы:
DESCRIBE products;

-- 3. Показать данные:
SELECT id, code, name FROM products LIMIT 3;

-- 4. Показать полную структуру с ключами:
SHOW CREATE TABLE products;


