-- Добавление поля sort_order в таблицу product_product_options
-- для индивидуальной сортировки опций для каждого товара

ALTER TABLE product_product_options
ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER option_id;

-- Добавляем индекс для оптимизации сортировки
CREATE INDEX idx_product_sort_order ON product_product_options (product_id, sort_order);

-- Обновляем существующие записи: устанавливаем sort_order по порядку для каждого товара
SET @row_num = 0;
SET @prev_product = 0;

UPDATE product_product_options ppo
SET sort_order = CASE
  WHEN @prev_product != product_id THEN (@row_num := 0) + (@prev_product := product_id) + 0
  ELSE @row_num := @row_num + 1
END
ORDER BY product_id, option_id;

