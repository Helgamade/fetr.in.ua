-- Добавление поля promo_code в таблицу orders и изменение customer_email на NULL

-- Добавляем поле promo_code только если его еще нет
SET @dbname = DATABASE();
SET @tablename = "orders";
SET @columnname = "promo_code";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(50) NULL AFTER comment")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Изменяем customer_email на NULL (убираем NOT NULL) - безопасно, если уже NULL
ALTER TABLE orders 
MODIFY COLUMN customer_email VARCHAR(255) NULL;

-- Убираем индекс на customer_email, если он существует
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = "idx_customer_email")
  ) > 0,
  "ALTER TABLE orders DROP INDEX idx_customer_email",
  "SELECT 1"
));
PREPARE dropIndexIfExists FROM @preparedStatement;
EXECUTE dropIndexIfExists;
DEALLOCATE PREPARE dropIndexIfExists;

