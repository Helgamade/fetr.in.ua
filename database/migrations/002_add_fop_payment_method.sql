-- Добавление нового способа оплаты 'fop' (Оплата на рахунок ФОП)
-- Также обновляем 'card' на 'online' для соответствия фронтенду
ALTER TABLE orders MODIFY COLUMN payment_method ENUM('online', 'cod', 'fop') NOT NULL;

