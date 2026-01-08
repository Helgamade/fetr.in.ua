-- Добавляем поле analytics_session_id в таблицу orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS analytics_session_id VARCHAR(255) NULL AFTER user_id;

-- Создаем индекс для быстрого поиска заказов по сессии
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON orders(analytics_session_id);

-- Добавляем внешний ключ (опционально, если нужно)
-- ALTER TABLE orders
--   ADD CONSTRAINT fk_analytics_session
--   FOREIGN KEY (analytics_session_id) REFERENCES analytics_sessions(session_id)
--   ON DELETE SET NULL;

