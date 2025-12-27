-- Скрипт для проверки имен внешних ключей перед миграцией
-- Выполнить перед migration_add_auto_increment_ids.sql

SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'idesig02_fetrinua'
  AND REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_NAME IN ('orders', 'order_items', 'products', 'product_images', 'product_features', 'product_product_options', 'product_options', 'order_item_options')
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

