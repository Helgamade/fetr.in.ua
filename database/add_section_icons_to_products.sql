-- Добавление полей для SVG иконок секций товаров
-- Иконки для: "Що входить", "Матеріали", "Що можна зробити", "Підходить для", "Додаткові опції"

ALTER TABLE products 
  ADD COLUMN section_icon_features TEXT NULL COMMENT 'SVG код или URL иконки для секции "Що входить"' AFTER full_description,
  ADD COLUMN section_icon_materials TEXT NULL COMMENT 'SVG код или URL иконки для секции "Матеріали"' AFTER section_icon_features,
  ADD COLUMN section_icon_can_make TEXT NULL COMMENT 'SVG код или URL иконки для секции "Що можна зробити"' AFTER section_icon_materials,
  ADD COLUMN section_icon_suitable_for TEXT NULL COMMENT 'SVG код или URL иконки для секции "Підходить для"' AFTER section_icon_can_make,
  ADD COLUMN section_icon_options TEXT NULL COMMENT 'SVG код или URL иконки для секции "Додаткові опції"' AFTER section_icon_suitable_for;

