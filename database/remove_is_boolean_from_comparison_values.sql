-- Удаление поля is_boolean из таблицы comparison_values
-- Тип теперь определяется из comparison_features.type
ALTER TABLE comparison_values DROP COLUMN is_boolean;

