-- Миграция: добавление поля repay_url в таблицу orders
-- Это поле хранит URL для повторной оплаты от WayForPay при неуспешной оплате

ALTER TABLE orders 
ADD COLUMN repay_url TEXT NULL 
AFTER payment_method;

-- Комментарий к полю
ALTER TABLE orders 
MODIFY COLUMN repay_url TEXT NULL COMMENT 'URL для повторной оплаты от WayForPay (repayUrl из callback)';
