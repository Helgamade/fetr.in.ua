# Настройка базы данных MySQL

## Шаг 1: Создание базы данных и таблиц

1. Подключитесь к MySQL серверу:
```bash
mysql -u idesig02 -p
```

2. Создайте базу данных (если еще не создана):
```sql
CREATE DATABASE IF NOT EXISTS idesig02_fetrinua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE idesig02_fetrinua;
```

3. Выполните SQL скрипты для создания таблиц:
```bash
mysql -u idesig02 -p idesig02_fetrinua < database/schema.sql
```

4. Заполните базу тестовыми данными:
```bash
mysql -u idesig02 -p idesig02_fetrinua < database/seed.sql
```

## Шаг 2: Настройка переменных окружения

Создайте файл `server/.env` на основе `server/.env.example`:

```env
DB_HOST=idesig02.mysql.tools
DB_USER=idesig02_fetrinua
DB_PASSWORD=7%j-7EyzF8
DB_NAME=idesig02_fetrinua
DB_PORT=3306
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://fetr.in.ua
```

**Примечание:** Хостинг автоматически устанавливает `PORT=3000` и `HOST=127.1.5.169` через переменные окружения, переопределяя значения из `.env`.

## Шаг 3: Запуск backend сервера

```bash
npm run server
```

Или в режиме разработки с автоперезагрузкой:
```bash
npm run server:dev
```

Сервер будет доступен на внутреннем адресе `127.1.5.169:3000` (хостинг автоматически устанавливает порт 3000).
Доступ извне через прокси: `https://fetr.in.ua/api/*`

## Шаг 4: Настройка frontend

**Примечание:** В коде `src/lib/api.ts` используется захардкоженное значение `API_BASE_URL = '/api'`. Дополнительная настройка не требуется.

## API Endpoints

- `GET /api/products` - получить все товары
- `GET /api/products/:id` - получить товар по ID или slug
- `POST /api/products` - создать товар
- `PUT /api/products/:id` - обновить товар
- `DELETE /api/products/:id` - удалить товар

- `GET /api/orders` - получить все заказы
- `GET /api/orders/:id` - получить заказ по ID
- `POST /api/orders` - создать заказ
- `PUT /api/orders/:id` - обновить заказ
- `PATCH /api/orders/:id/status` - обновить статус заказа

- `GET /api/settings` - получить все настройки
- `GET /api/settings/:key` - получить настройку по ключу
- `PUT /api/settings/:key` - обновить настройку
- `PUT /api/settings` - обновить несколько настроек

И аналогично для:
- `/api/users`
- `/api/pages`
- `/api/faqs`
- `/api/reviews`
- `/api/team`
- `/api/gallery`

## Структура таблиц

- `products` - товары
- `product_images` - изображения товаров
- `product_options` - опции товаров
- `product_product_options` - связь товаров и опций
- `product_features` - характеристики товаров (features, materials, canMake, suitableFor)
- `orders` - заказы
- `order_items` - позиции заказов
- `order_item_options` - опции в позициях заказов
- `settings` - настройки магазина
- `users` - пользователи
- `pages` - страницы сайта
- `faqs` - часто задаваемые вопросы
- `reviews` - отзывы
- `team_members` - команда
- `gallery_images` - галерея

