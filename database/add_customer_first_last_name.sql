-- Добавление полей customer_first_name и customer_last_name в таблицу orders
-- Миграция для разделения customer_name на отдельные поля

ALTER TABLE orders 
ADD COLUMN customer_first_name VARCHAR(255) NULL AFTER customer_name,
ADD COLUMN customer_last_name VARCHAR(255) NULL AFTER customer_first_name;

-- Заполняем существующие данные: парсим customer_name на firstName и lastName
-- Последнее слово = lastName, все остальные = firstName
UPDATE orders 
SET 
  customer_last_name = SUBSTRING_INDEX(customer_name, ' ', -1),
  customer_first_name = CASE 
    WHEN LOCATE(' ', customer_name) > 0 
    THEN SUBSTRING(customer_name, 1, LENGTH(customer_name) - LENGTH(SUBSTRING_INDEX(customer_name, ' ', -1)) - 1)
    ELSE NULL
  END
WHERE customer_name IS NOT NULL AND customer_name != '';
