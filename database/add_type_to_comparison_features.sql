-- Добавление поля type в таблицу comparison_features
ALTER TABLE comparison_features 
ADD COLUMN type ENUM('text', 'boolean') NOT NULL DEFAULT 'text' AFTER label;


