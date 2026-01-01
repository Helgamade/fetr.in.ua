-- Добавление нового способа оплаты 'fop' (Оплата на рахунок ФОП)
-- Оставляем 'card' для обратной совместимости (маппится с 'online' на фронтенде)
ALTER TABLE orders MODIFY COLUMN payment_method ENUM('card', 'cod', 'fop') NOT NULL;

