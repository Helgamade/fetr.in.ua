-- Добавить поле daily_sales_target (целевое количество продаж в день) в таблицу products

ALTER TABLE products
ADD COLUMN daily_sales_target INT NULL DEFAULT NULL COMMENT 'Целевое количество продаж в день (для модуля Social Proof и отображения "X купили сегодня")' AFTER purchase_count;

-- Установить значения для существующих товаров (на основе старых значений из кода)
-- Товар 1 (Starter) - 7 продаж/день
-- Товар 2 (Optimal) - 10 продаж/день  
-- Товар 3 (Premium) - 5 продаж/день
UPDATE products SET daily_sales_target = 7 WHERE code = 'starter';
UPDATE products SET daily_sales_target = 10 WHERE code = 'optimal';
UPDATE products SET daily_sales_target = 5 WHERE code = 'premium';
