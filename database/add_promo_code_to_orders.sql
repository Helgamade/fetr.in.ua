-- Добавление поля promo_code в таблицу orders и изменение customer_email на NULL

-- Добавляем поле promo_code
ALTER TABLE orders 
ADD COLUMN promo_code VARCHAR(50) NULL AFTER comment;

-- Изменяем customer_email на NULL (убираем NOT NULL)
ALTER TABLE orders 
MODIFY COLUMN customer_email VARCHAR(255) NULL;

-- Убираем индекс на customer_email, так как он больше не нужен
ALTER TABLE orders 
DROP INDEX idx_customer_email;

