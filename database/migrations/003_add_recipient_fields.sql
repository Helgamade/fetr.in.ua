-- Добавление полей для получателя заказа
-- Если заказчик и получатель разные люди
ALTER TABLE orders 
  ADD COLUMN recipient_name VARCHAR(255) NULL AFTER customer_phone,
  ADD COLUMN recipient_phone VARCHAR(50) NULL AFTER recipient_name,
  ADD COLUMN recipient_first_name VARCHAR(255) NULL AFTER recipient_phone,
  ADD COLUMN recipient_last_name VARCHAR(255) NULL AFTER recipient_first_name;

