-- Простая версия - выполнить только те команды, которых еще нет

-- Если promo_code уже существует, пропустите эту команду:
-- ALTER TABLE orders ADD COLUMN promo_code VARCHAR(50) NULL AFTER comment;

-- Изменяем customer_email на NULL (убираем NOT NULL)
ALTER TABLE orders 
MODIFY COLUMN customer_email VARCHAR(255) NULL;

-- Убираем индекс на customer_email, если он существует (выполнить только если индекс есть)
-- ALTER TABLE orders DROP INDEX idx_customer_email;

