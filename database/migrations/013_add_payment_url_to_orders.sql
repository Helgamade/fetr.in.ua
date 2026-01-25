-- Миграция: добавление поля payment_url в таблицу orders
-- Это поле хранит первую ссылку на оплату от WayForPay (URL с paymentData для формы)

ALTER TABLE orders 
ADD COLUMN payment_url TEXT NULL 
AFTER repay_url;

-- Комментарий к полю
ALTER TABLE orders 
MODIFY COLUMN payment_url TEXT NULL COMMENT 'Первая ссылка на оплату WayForPay (URL с paymentData для формы POST)';
