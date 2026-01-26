-- Удаление полей customer_name и recipient_name из таблицы orders
-- ВНИМАНИЕ: Выполнять ТОЛЬКО после того, как весь код обновлен и не использует эти поля

-- Удаляем поля
ALTER TABLE orders 
DROP COLUMN customer_name,
DROP COLUMN recipient_name;
