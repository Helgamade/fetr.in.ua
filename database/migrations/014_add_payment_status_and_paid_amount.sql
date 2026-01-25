-- Миграция: добавление полей payment_status и paid_amount в таблицу orders
-- payment_status - статус оплаты (независимый от статуса заказа)
-- paid_amount - фактическая сумма оплаты

ALTER TABLE orders
ADD COLUMN payment_status ENUM('not_paid', 'cash_on_delivery', 'paid') NOT NULL DEFAULT 'not_paid'
AFTER payment_method;

ALTER TABLE orders
ADD COLUMN paid_amount DECIMAL(10, 2) NULL
AFTER payment_status;

-- Комментарии к полям
ALTER TABLE orders
MODIFY COLUMN payment_status ENUM('not_paid', 'cash_on_delivery', 'paid') NOT NULL DEFAULT 'not_paid' 
COMMENT 'Статус оплаты: not_paid - Не оплачено, cash_on_delivery - Післяплата, paid - Оплачено';

ALTER TABLE orders
MODIFY COLUMN paid_amount DECIMAL(10, 2) NULL 
COMMENT 'Фактическая сумма оплаты заказа';

-- Индекс для быстрого поиска по статусу оплаты
ALTER TABLE orders
ADD INDEX idx_payment_status (payment_status);
