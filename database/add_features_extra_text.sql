-- Добавление поля features_extra_text в таблицу products
ALTER TABLE products
  ADD COLUMN features_extra_text VARCHAR(255) NULL 
  COMMENT 'Текст для отображения дополнительных позиций (например, "+ ще 2 позицій")' 
  AFTER section_icon_options;
