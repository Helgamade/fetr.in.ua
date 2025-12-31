# Настройка WayForPay

## Реквизиты мерчанта

- **Merchant login:** `www_fetr_in_ua`
- **Merchant secret key:** `77cbf18313c8c17e70ffe4bfad6b50fa37bb8ef5`
- **Merchant password:** `893f8e94f5c617f16e973b898ae7335c` (используется для других операций)

## Настройка переменных окружения

Добавьте следующие переменные в файл `server/.env`:

```env
WAYFORPAY_MERCHANT_ACCOUNT=www_fetr_in_ua
WAYFORPAY_SECRET_KEY=77cbf18313c8c17e70ffe4bfad6b50fa37bb8ef5
WAYFORPAY_DOMAIN=fetr.in.ua
WAYFORPAY_RETURN_URL=https://fetr.in.ua/thank-you
WAYFORPAY_SERVICE_URL=https://fetr.in.ua/api/wayforpay/callback
```

## Описание переменных

- `WAYFORPAY_MERCHANT_ACCOUNT` - Логин мерчанта (Merchant login)
- `WAYFORPAY_SECRET_KEY` - Секретный ключ для подписи запросов (Merchant secret key)
- `WAYFORPAY_DOMAIN` - Домен магазина (должен соответствовать домену в настройках WayForPay)
- `WAYFORPAY_RETURN_URL` - URL для возврата пользователя после оплаты
- `WAYFORPAY_SERVICE_URL` - URL для callback от WayForPay (обработка результата платежа)

## Как работает интеграция

1. **Создание заказа:** Пользователь оформляет заказ и выбирает "Онлайн оплата"
2. **Создание платежа:** После создания заказа в БД, сервер формирует данные для WayForPay с подписью
3. **Редирект на WayForPay:** Пользователь перенаправляется на страницу оплаты WayForPay
4. **Оплата:** Пользователь оплачивает заказ через WayForPay
5. **Callback:** WayForPay отправляет POST запрос на `WAYFORPAY_SERVICE_URL` с результатом платежа
6. **Обновление статуса:** Сервер обновляет статус заказа в БД (paid/awaiting_payment)
7. **Возврат:** Пользователь возвращается на `WAYFORPAY_RETURN_URL` (страница благодарности)

## API Endpoints

- `POST /api/wayforpay/create-payment` - Создание платежа WayForPay
  - Тело запроса: `{ "orderId": "ORD-..." }`
  - Ответ: `{ "paymentUrl": "...", "paymentData": {...} }`

- `POST /api/wayforpay/callback` - Callback от WayForPay (вызывается автоматически)
  - Обрабатывает результат платежа и обновляет статус заказа

## Проверка работы

1. Убедитесь, что переменные окружения настроены
2. Перезапустите сервер после добавления переменных
3. Оформите тестовый заказ с онлайн-оплатой
4. Проверьте, что происходит редирект на WayForPay
5. Используйте тестовые карты WayForPay для проверки платежа
6. Проверьте, что callback обрабатывается и статус заказа обновляется

## Документация WayForPay

- [Документация API](https://wiki.wayforpay.com/uk)
- [Тестовые реквизиты](https://wiki.wayforpay.com/uk/view/852100)

