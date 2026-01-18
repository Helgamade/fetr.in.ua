-- Добавить поле actual_purchase_count (реальное количество продаж из завершенных заказов)
ALTER TABLE products
ADD COLUMN actual_purchase_count INT NOT NULL DEFAULT 0 COMMENT 'Реальное количество продаж из заказов со статусом completed' AFTER purchase_count;

-- Вычислить начальное значение на основе существующих заказов
UPDATE products p
SET actual_purchase_count = (
  SELECT COALESCE(SUM(oi.quantity), 0)
  FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.id
  WHERE oi.product_id = p.id
    AND o.status = 'completed'
);
