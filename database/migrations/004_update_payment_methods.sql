-- Обновление способов оплаты: wayforpay, nalojka, fopiban
-- Заменяем старые значения: card -> wayforpay, cod -> nalojka, fop -> fopiban
ALTER TABLE orders MODIFY COLUMN payment_method ENUM('wayforpay', 'nalojka', 'fopiban') NOT NULL;

-- Обновляем существующие записи в базе данных
UPDATE orders SET payment_method = 'wayforpay' WHERE payment_method = 'card';
UPDATE orders SET payment_method = 'nalojka' WHERE payment_method = 'cod';
UPDATE orders SET payment_method = 'fopiban' WHERE payment_method = 'fop';

