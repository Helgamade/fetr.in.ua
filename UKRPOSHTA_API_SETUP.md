# Настройка API Укрпошты

## Важное примечание

API Укрпошты состоит из двух частей:

1. **Адресный классификатор** (`https://www.ukrposhta.ua/address-classifier-ws/`)
   - **Требует PROD_COUNTERPARTY TOKEN** для Address Classifier API
   - URL должен быть с www: `https://www.ukrposhta.ua/address-classifier-ws/`
   - Используется для поиска городов и отделений
   - См. документацию: `Search-offices-and-indexes-v3.pdf` и `Address-classifier-v3.20-09122024.xml`

2. **ecom API** (`https://www.ukrposhta.ua/ecom/0.0.1`)
   - Требует PRODUCTION BEARER eCom токен
   - Используется для создания адресы, клиентов, отправлений
   - См. документацию: `API-інструкція.pdf`

**Для текущей реализации (выбор города и отделения) используется адресный классификатор с PROD_COUNTERPARTY TOKEN.**

## Добавление ключей в server/.env

Добавьте следующие строки в файл `server/.env`:

```env
# Укрпошта API настройки (PRODUCTION)
# PROD_COUNTERPARTY TOKEN для Address Classifier API (поиск городов и отделений)
UKRPOSHTA_BEARER_TOKEN=ab714b81-60a5-4dc5-a106-1a382f8d84bf
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
# PROD_COUNTERPARTY TOKEN для Address Classifier API
UKRPOSHTA_BEARER_TOKEN=ab714b81-60a5-4dc5-a106-1a382f8d84bf
# PRODUCTION BEARER eCom для создания отправлений (если понадобится)
# UKRPOSHTA_ECOM_TOKEN=67f02a7c-3af7-34d1-aa18-7eb4d96f3be4
```

## Значения из файла АРІ_ключі.pdf:

### PRODUCTION (продакшн):
- **PROD_COUNTERPARTY TOKEN**: `ab714b81-60a5-4dc5-a106-1a382f8d84bf` ⭐ **Для Address Classifier API**
- **PRODUCTION BEARER eCom**: `67f02a7c-3af7-34d1-aa18-7eb4d96f3be4` - для создания отправлений
- **PRODUCTION BEARER StatusTracking**: `7f37c2c3-780b-3602-8e18-b7e50b901cd5` - для отслеживания посылок

### SANDBOX (тестовое окружение):
- **SANDBOX_COUNTERPARTY_TOKEN**: `2fbee77e-2f39-3f34-823f-52d4b3e0bae2` - для Address Classifier API
- **SANDBOX BEARER eCom**: `4bfd1c4e-ff8f-3952-bb30-8fc17c5975db` - для создания отправлений
- **SANDBOX BEARER StatusTracking**: `d4ff701b-795e-3951-a7dc-1202d6fa388a` - для отслеживания посылок

**Важно:** 
- Для Address Classifier API (поиск городов и отделений) используется **PROD_COUNTERPARTY TOKEN**
- Для создания отправлений используется **PRODUCTION BEARER eCom**

## Текущая реализация

Текущая реализация использует **адресный классификатор API** для поиска городов и отделений:

- **Базовый URL:** `https://www.ukrposhta.ua/address-classifier-ws/` (с www)
- **Токен:** `PROD_COUNTERPARTY TOKEN` (`ab714b81-60a5-4dc5-a106-1a382f8d84bf`)
- **Endpoints:**
  - Поиск городов: `/get_city_by_region_id_and_district_id_and_city_ua?city_ua={назва_міста}`
  - Получение отделений: `/get_postoffices_by_postcode_cityid_cityvpzid?city_id={CITY_ID}`

**Пример запроса:**
```bash
curl -X GET \
  --header 'Authorization: Bearer ab714b81-60a5-4dc5-a106-1a382f8d84bf' \
  --header 'Accept: application/json' \
  'https://www.ukrposhta.ua/address-classifier-ws/get_city_by_region_id_and_district_id_and_city_ua?city_ua=ворон'
```

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

