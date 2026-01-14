-- Добавление поля sort_order в таблицу materials
-- Дата: 2025-01-14

ALTER TABLE materials 
ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER thumbnail;

CREATE INDEX idx_materials_sort_order ON materials(sort_order);
