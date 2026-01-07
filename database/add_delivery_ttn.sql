-- Добавление поля delivery_ttn для номера накладной доставки (Нова Пошта/Укрпошта)
-- tracking_token используется ТОЛЬКО для безопасной ссылки отслеживания заказа

USE idesig02_fetrinua;

ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS delivery_ttn VARCHAR(50) NULL AFTER tracking_token;

-- Индекс для поиска по ТТН доставки
CREATE INDEX IF NOT EXISTS idx_delivery_ttn ON orders(delivery_ttn);

