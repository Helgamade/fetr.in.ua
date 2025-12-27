-- Добавление поля display_order для сортировки товаров
-- Если колонка уже существует, будет ошибка - это нормально
ALTER TABLE products ADD COLUMN display_order INT NOT NULL DEFAULT 0 AFTER purchase_count;

-- Установка порядка отображения для существующих товаров
UPDATE products SET display_order = CASE id 
  WHEN 'starter' THEN 1 
  WHEN 'optimal' THEN 2 
  WHEN 'premium' THEN 3 
  ELSE 0 
END;

