-- Обновление способов оплаты: wayforpay, nalojka, fopiban
ALTER TABLE orders MODIFY COLUMN payment_method ENUM('wayforpay', 'nalojka', 'fopiban') NOT NULL;

