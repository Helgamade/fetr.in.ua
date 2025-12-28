# Миграция: Добавление автоинкрементных id

## Внимание!
Эта миграция изменяет структуру основных таблиц базы данных. **Обязательно сделайте резервную копию базы данных перед выполнением!**

## Что делает миграция:

1. **Таблица `orders`**:
   - Переименовывает текущее поле `id` (VARCHAR) в `order_number` (для номера заказа типа "ORD-123")
   - Добавляет новое автоинкрементное поле `id` (INT) как PRIMARY KEY

2. **Таблица `products`**:
   - Переименовывает текущее поле `id` (VARCHAR) в `code` (для кода товара типа "starter", "optimal")
   - Добавляет новое автоинкрементное поле `id` (INT) как PRIMARY KEY

3. **Таблица `product_options`**:
   - Переименовывает текущее поле `id` (VARCHAR) в `code` (для кода опции типа "gift-wrap")
   - Добавляет новое автоинкрементное поле `id` (INT) как PRIMARY KEY

4. **Таблица `product_product_options`**:
   - Добавляет автоинкрементное поле `id` (INT) как PRIMARY KEY
   - Сохраняет составной UNIQUE ключ на `(product_id, option_id)`

## Порядок выполнения:

1. **Сделайте резервную копию базы данных:**
   ```bash
   mysqldump -h idesig02.mysql.tools -u idesig02_fetrinua -p idesig02_fetrinua > backup_before_migration.sql
   ```

2. **Проверьте имена внешних ключей:**
   ```bash
   mysql -h idesig02.mysql.tools -u idesig02_fetrinua -p idesig02_fetrinua < database/check_foreign_keys.sql
   ```

3. **Выполните миграцию:**
   ```bash
   mysql -h idesig02.mysql.tools -u idesig02_fetrinua -p idesig02_fetrinua < database/migration_add_auto_increment_ids.sql
   ```

4. **После миграции нужно обновить код:**
   - `server/routes/orders.js` - использовать `order_number` вместо `id` для номера заказа
   - `server/routes/products.js` - использовать `code` вместо `id` для кода товара
   - Все запросы, которые используют `products.id`, `product_options.id`, `orders.id` нужно обновить

## Важно:

- Миграция выполняется пошагово, но если что-то пойдет не так, используйте резервную копию для восстановления
- После миграции код нужно обновить, чтобы использовать новые поля (`order_number`, `code`) для строковых идентификаторов
- Автоинкрементные `id` будут использоваться для внутренних связей и внешних ключей


