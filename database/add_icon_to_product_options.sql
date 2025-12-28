-- Добавление поля icon в таблицу product_options
ALTER TABLE product_options 
ADD COLUMN icon TEXT NULL COMMENT 'SVG код или URL иконки' 
AFTER description;

