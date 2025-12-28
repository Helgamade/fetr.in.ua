-- Добавление поля sort_order в таблицу product_product_options
-- для индивидуальной сортировки опций для каждого товара

ALTER TABLE product_product_options
ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER option_id;

-- Добавляем индекс для оптимизации сортировки
CREATE INDEX idx_product_sort_order ON product_product_options (product_id, sort_order);

-- Обновляем существующие записи: устанавливаем sort_order по порядку для каждого товара
-- Используем JOIN с подзапросом для обхода ограничения MySQL
UPDATE product_product_options ppo
JOIN (
  SELECT 
    ppo1.product_id,
    ppo1.option_id,
    COUNT(*) - 1 as new_sort_order
  FROM product_product_options ppo1
  JOIN product_product_options ppo2
    ON ppo2.product_id = ppo1.product_id
    AND ppo2.option_id <= ppo1.option_id
  GROUP BY ppo1.product_id, ppo1.option_id
) AS sorted
ON sorted.product_id = ppo.product_id
  AND sorted.option_id = ppo.option_id
SET ppo.sort_order = sorted.new_sort_order;

