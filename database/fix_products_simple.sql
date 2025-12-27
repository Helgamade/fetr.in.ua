-- Простое решение: если PRIMARY KEY уже есть, но таблица не редактируется
-- Проверьте, на каком поле PRIMARY KEY

-- Если PRIMARY KEY на поле id (VARCHAR), и вы хотите переключить на code:

-- 1. Проверьте текущее состояние:
SHOW KEYS FROM products WHERE Key_name = 'PRIMARY';

-- 2. Если PRIMARY KEY на id, удалите его:
ALTER TABLE products DROP PRIMARY KEY;

-- 3. Добавьте PRIMARY KEY на code:
ALTER TABLE products ADD PRIMARY KEY (code);

-- Теперь таблица должна быть редактируемой

-- Если нужно продолжить миграцию:
-- 4. Удалите PRIMARY KEY снова:
ALTER TABLE products DROP PRIMARY KEY;

-- 5. Удалите старое поле id:
ALTER TABLE products DROP COLUMN id;

-- 6. Добавьте новое автоинкрементное id:
ALTER TABLE products ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- 7. Проверьте результат:
SELECT id, code, name FROM products;

