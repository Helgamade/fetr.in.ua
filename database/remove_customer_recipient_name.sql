-- Удаление полей customer_name и recipient_name из таблицы orders
-- ВНИМАНИЕ: Выполнять ТОЛЬКО после того, как все данные мигрированы в customer_first_name и customer_last_name
-- И после того, как весь код обновлен для работы без этих полей

-- Сначала проверяем, что все заказы имеют заполненные customer_first_name и customer_last_name
-- Если есть NULL значения, заполняем их из customer_name
UPDATE orders 
SET 
  customer_last_name = COALESCE(customer_last_name, SUBSTRING_INDEX(customer_name, ' ', -1)),
  customer_first_name = COALESCE(customer_first_name, CASE 
    WHEN LOCATE(' ', customer_name) > 0 
    THEN SUBSTRING(customer_name, 1, LENGTH(customer_name) - LENGTH(SUBSTRING_INDEX(customer_name, ' ', -1)) - 1)
    ELSE NULL
  END)
WHERE (customer_first_name IS NULL OR customer_last_name IS NULL) 
  AND customer_name IS NOT NULL AND customer_name != '';

-- Аналогично для recipient
UPDATE orders 
SET 
  recipient_last_name = COALESCE(recipient_last_name, SUBSTRING_INDEX(recipient_name, ' ', -1)),
  recipient_first_name = COALESCE(recipient_first_name, CASE 
    WHEN LOCATE(' ', recipient_name) > 0 
    THEN SUBSTRING(recipient_name, 1, LENGTH(recipient_name) - LENGTH(SUBSTRING_INDEX(recipient_name, ' ', -1)) - 1)
    ELSE NULL
  END)
WHERE (recipient_first_name IS NULL OR recipient_last_name IS NULL) 
  AND recipient_name IS NOT NULL AND recipient_name != '';

-- Теперь можно безопасно удалить поля
ALTER TABLE orders 
DROP COLUMN customer_name,
DROP COLUMN recipient_name;
