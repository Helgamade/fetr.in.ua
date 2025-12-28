-- Добавление поля sort_order в таблицу product_product_options
-- для индивидуальной сортировки опций для каждого товара

ALTER TABLE product_product_options
ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER option_id;

-- Добавляем индекс для оптимизации сортировки
CREATE INDEX idx_product_sort_order ON product_product_options (product_id, sort_order);

-- Обновляем существующие записи: устанавливаем sort_order по порядку для каждого товара
-- Используем подзапрос для нумерации
UPDATE product_product_options ppo
SET sort_order = (
  SELECT COUNT(*) - 1
  FROM product_product_options ppo2
  WHERE ppo2.product_id = ppo.product_id
    AND ppo2.option_id <= ppo.option_id
);

