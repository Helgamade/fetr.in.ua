-- Добавление полей order_number и tracking_token для удобочитаемых номеров и безопасного отслеживания
-- ВАЖНО: Эта миграция предполагает, что id уже INT AUTO_INCREMENT
-- Если id VARCHAR, нужно сначала изменить структуру вручную

-- Добавляем поля (если их еще нет)
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) NULL AFTER id,
  ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(15) NULL AFTER order_number;

-- Создаем индексы (если их еще нет)
-- MySQL не поддерживает IF NOT EXISTS для CREATE INDEX, поэтому используем скрипт
-- CREATE UNIQUE INDEX idx_order_number ON orders(order_number);
-- CREATE UNIQUE INDEX idx_tracking_token ON orders(tracking_token);

-- Устанавливаем AUTO_INCREMENT на 305317
-- Это нужно делать только если таблица пустая или если хотите начать с этого номера
-- ALTER TABLE orders AUTO_INCREMENT = 305317;

