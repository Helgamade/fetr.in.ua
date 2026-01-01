# Настройка API Укрпошты

## Важное примечание

API Укрпошты состоит из двух частей:

1. **Адресный классификатор** (`https://www.ukrposhta.ua/address-classifier-ws/`)
   - **Требует Authorization Bearer токен** (такой же, как для оформления отправлений)
   - URL должен быть с www: `https://www.ukrposhta.ua/address-classifier-ws/`
   - Используется для поиска городов и отделений
   - См. документацию: `Search-offices-and-indexes-v3.pdf` и `Address-classifier-v3.20-09122024.xml`

2. **ecom API** (`https://www.ukrposhta.ua/ecom/0.0.1`)
   - Требует Bearer токен
   - Используется для создания адресы, клиентов, отправлений
   - См. документацию: `API-інструкція.pdf`

**Для текущей реализации (выбор города и отделения) используется адресный классификатор, требуется Bearer токен.**

## Добавление ключей в server/.env

Добавьте следующие строки в файл `server/.env`:

```env
# Укрпошта API настройки (PRODUCTION)
# Bearer токен для адресного классификатора и ecom API
UKRPOSHTA_BEARER_TOKEN=68cff37f-1e85-4fa9-b0a8-36c0f1ba5d40
```

### Для тестирования (Sandbox):

Если хотите использовать тестовое окружение, используйте:

```env
# Укрпошта API настройки (SANDBOX)
UKRPOSHTA_API_BASE=https://www.ukrposhta.ua/ecom/0.0.1
UKRPOSHTA_BEARER_TOKEN=4bfd1c4e-ff8f-3952-bb30-8fc17c5975db
```

### Полный пример server/.env:

```env
DB_HOST=idesig02.mysql.tools
DB_USER=idesig02_fetrinua
DB_PASSWORD=7%j-7EyzF8
DB_NAME=idesig02_fetrinua
DB_PORT=3306
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://fetr.in.ua

# WayForPay настройки
WAYFORPAY_MERCHANT_ACCOUNT=www_fetr_in_ua
WAYFORPAY_SECRET_KEY=77cbf18313c8c17e70ffe4bfad6b50fa37bb8ef5
WAYFORPAY_PASSWORD=893f8e94f5c617f16e973b898ae7335c
WAYFORPAY_DOMAIN=fetr.in.ua
WAYFORPAY_RETURN_URL=https://fetr.in.ua/thank-you
WAYFORPAY_SERVICE_URL=https://fetr.in.ua/api/wayforpay/callback

# Укрпошта API настройки (PRODUCTION)
UKRPOSHTA_API_BASE=https://www.ukrposhta.ua/ecom/0.0.1
UKRPOSHTA_BEARER_TOKEN=67f02a7c-3af7-34d1-aa18-7eb4d96f3be4
```

## Значения из файла АРІ_ключі.pdf:

### PRODUCTION (продакшн):
- **PRODUCTION BEARER eCom**: `67f02a7c-3af7-34d1-aa18-7eb4d96f3be4`
- **PRODUCTION BEARER StatusTracking**: `7f37c2c3-780b-3602-8e18-b7e50b901cd5`

### SANDBOX (тестовое окружение):
- **SANDBOX BEARER eCom**: `4bfd1c4e-ff8f-3952-bb30-8fc17c5975db`
- **SANDBOX BEARER StatusTracking**: `d4ff701b-795e-3951-a7dc-1202d6fa388a`

**Важно:** Для работы с городами и отделениями через адресный классификатор токен НЕ требуется. Токен нужен только для ecom API (создание отправлений).

## Текущая реализация

Текущая реализация использует **адресный классификатор API** для поиска городов и отделений:

- **Базовый URL:** `https://ukrposhta.ua/address-classifier-ws/`
- **Токен:** Не требуется (публичный API)
- **Endpoints:**
  - Поиск городов: `/get_city_by_region_id_and_city_ua?region_id=...&city_ua=...`
  - Получение отделений: `/get_postoffices_by_city_id?city_id={CITY_ID}`

Подробнее см. `UKRPOSHTA_ADDRESS_CLASSIFIER.md`

## Примечания:

1. **Адресный классификатор:** Реализация использует адресный классификатор согласно документации `Search-offices-and-indexes-v3.pdf`. Endpoints могут быть уточнены в документации `Address-classifier-v3.20-09122024.pdf`.

2. **Структура ответа API:** Структура данных адресного классификатора: `{Entries: {Entry: [...]}}`. Преобразование данных реализовано в `server/routes/ukrposhta.js`.

3. **Перезапуск сервера:** После изменения `.env` файла необходимо перезапустить сервер:
   ```bash
   cd /home/idesig02/fetr.in.ua/www
   ./server/stop.sh
   ./server/start.sh
   ```

4. **Проверка работы:** После настройки проверьте работу API:
   ```bash
   curl https://fetr.in.ua/api/ukrposhta/cities/popular
   ```

