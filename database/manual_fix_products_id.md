# Ручное добавление автоинкрементного id в products

## Шаг 1: Проверка текущих внешних ключей

Выполните в phpMyAdmin:
```sql
SHOW CREATE TABLE product_images;
SHOW CREATE TABLE product_features;
SHOW CREATE TABLE product_product_options;
SHOW CREATE TABLE order_items;
```

Найдите имена внешних ключей (они будут в формате `CONSTRAINT имя_ключа FOREIGN KEY`).

## Шаг 2: Обновление product_images

### 2.1. Найдите имя внешнего ключа из Шага 1, затем выполните:
```sql
ALTER TABLE product_images DROP FOREIGN KEY имя_ключа_из_шага_1;
```

### 2.2. Добавьте новую колонку:
```sql
ALTER TABLE product_images ADD COLUMN product_code VARCHAR(50) NULL AFTER id;
```

### 2.3. Заполните данными:
```sql
UPDATE product_images pi 
INNER JOIN products p ON pi.product_id = p.id 
SET pi.product_code = p.code;
```

### 2.4. Удалите старую колонку:
```sql
ALTER TABLE product_images DROP COLUMN product_id;
```

### 2.5. Сделайте новую колонку NOT NULL и добавьте внешний ключ:
```sql
ALTER TABLE product_images MODIFY COLUMN product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_images ADD FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE;
```

## Шаг 3: Обновление product_features

### 3.1. Удалите внешний ключ (найдите имя из Шага 1):
```sql
ALTER TABLE product_features DROP FOREIGN KEY имя_ключа;
```

### 3.2-3.5. Повторите шаги 2.2-2.5 для product_features:
```sql
ALTER TABLE product_features ADD COLUMN product_code VARCHAR(50) NULL AFTER id;
UPDATE product_features pf INNER JOIN products p ON pf.product_id = p.id SET pf.product_code = p.code;
ALTER TABLE product_features DROP COLUMN product_id;
ALTER TABLE product_features MODIFY COLUMN product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_features ADD FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE;
```

## Шаг 4: Обновление product_product_options

### 4.1. Удалите внешний ключ:
```sql
ALTER TABLE product_product_options DROP FOREIGN KEY имя_ключа;
```

### 4.2-4.6:
```sql
ALTER TABLE product_product_options ADD COLUMN product_code VARCHAR(50) NULL FIRST;
UPDATE product_product_options ppo INNER JOIN products p ON ppo.product_id = p.id SET ppo.product_code = p.code;
ALTER TABLE product_product_options DROP COLUMN product_id;
ALTER TABLE product_product_options MODIFY COLUMN product_code VARCHAR(50) NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_code, option_id);
ALTER TABLE product_product_options ADD FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE;
```

## Шаг 5: Обновление order_items

### 5.1. Удалите внешний ключ:
```sql
ALTER TABLE order_items DROP FOREIGN KEY имя_ключа;
```

### 5.2-5.5:
```sql
ALTER TABLE order_items ADD COLUMN product_code VARCHAR(50) NULL AFTER order_id;
UPDATE order_items oi INNER JOIN products p ON oi.product_id = p.id SET oi.product_code = p.code;
ALTER TABLE order_items DROP COLUMN product_id;
ALTER TABLE order_items MODIFY COLUMN product_code VARCHAR(50) NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (product_code) REFERENCES products(code);
```

## Шаг 6: Изменение структуры products

### 6.1. Убедитесь, что поле code существует и уникально:
```sql
SELECT code FROM products;
```
Если code не существует, создайте его:
```sql
ALTER TABLE products ADD COLUMN code VARCHAR(50) NULL;
UPDATE products SET code = id;
ALTER TABLE products MODIFY COLUMN code VARCHAR(50) NOT NULL;
ALTER TABLE products ADD UNIQUE KEY idx_code (code);
```

### 6.2. Добавьте PRIMARY KEY на code (чтобы таблица была редактируемой):
```sql
ALTER TABLE products ADD PRIMARY KEY (code);
```

### 6.3. Теперь удалите PRIMARY KEY:
```sql
ALTER TABLE products DROP PRIMARY KEY;
```

### 6.4. Удалите старое поле id:
```sql
ALTER TABLE products DROP COLUMN id;
```

### 6.5. Добавьте новое автоинкрементное id:
```sql
ALTER TABLE products ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
```

### 6.4. Проверьте результат:
```sql
SELECT id, code, name FROM products;
```
Должны увидеть: id (1, 2, 3...), code (starter, optimal, premium), name

## Шаг 7: Возврат обратно на новый id

Теперь нужно вернуть все таблицы обратно, чтобы они использовали новый INT id вместо code.

### 7.1. product_images:
```sql
ALTER TABLE product_images DROP FOREIGN KEY product_images_ibfk_1;
ALTER TABLE product_images ADD COLUMN product_id INT NULL AFTER id;
UPDATE product_images pi INNER JOIN products p ON pi.product_code = p.code SET pi.product_id = p.id;
ALTER TABLE product_images DROP COLUMN product_code;
ALTER TABLE product_images MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE product_images ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
```

### 7.2. product_features:
```sql
ALTER TABLE product_features DROP FOREIGN KEY product_features_ibfk_1;
ALTER TABLE product_features ADD COLUMN product_id INT NULL AFTER id;
UPDATE product_features pf INNER JOIN products p ON pf.product_code = p.code SET pf.product_id = p.id;
ALTER TABLE product_features DROP COLUMN product_code;
ALTER TABLE product_features MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE product_features ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
```

### 7.3. product_product_options:
```sql
ALTER TABLE product_product_options DROP FOREIGN KEY product_product_options_ibfk_1;
ALTER TABLE product_product_options ADD COLUMN product_id INT NULL FIRST;
UPDATE product_product_options ppo INNER JOIN products p ON ppo.product_code = p.code SET ppo.product_id = p.id;
ALTER TABLE product_product_options DROP COLUMN product_code;
ALTER TABLE product_product_options MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE product_product_options DROP PRIMARY KEY;
ALTER TABLE product_product_options ADD PRIMARY KEY (product_id, option_id);
ALTER TABLE product_product_options ADD FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
```

### 7.4. order_items:
```sql
ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;
ALTER TABLE order_items ADD COLUMN product_id INT NULL AFTER order_id;
UPDATE order_items oi INNER JOIN products p ON oi.product_code = p.code SET oi.product_id = p.id;
ALTER TABLE order_items DROP COLUMN product_code;
ALTER TABLE order_items MODIFY COLUMN product_id INT NOT NULL;
ALTER TABLE order_items ADD FOREIGN KEY (product_id) REFERENCES products(id);
```

## Финальная проверка

```sql
SELECT id, code, name FROM products;
DESCRIBE products;
```

В таблице products должно быть:
- `id` INT AUTO_INCREMENT PRIMARY KEY (1, 2, 3...)
- `code` VARCHAR(50) UNIQUE (starter, optimal, premium)

