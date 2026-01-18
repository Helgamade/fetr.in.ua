-- Таблица для хранения базового значения purchase_count на начало дня
-- Используется для корректного обновления purchase_count в течение дня

CREATE TABLE IF NOT EXISTS product_daily_base (
  product_id INT NOT NULL,
  base_date DATE NOT NULL,
  base_purchase_count INT NOT NULL,
  PRIMARY KEY (product_id, base_date),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_base_date (base_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
