# API Укрпошты - Endpoints для поиска городов и отделений

## Важное примечание

Согласно официальной документации API Укрпошты (раздел 2 "Адреса"), в документации описаны только следующие endpoints:

- `POST /addresses` - создание адресы
- `GET /addresses/{id}` - получение адресы по ID

**Endpoints для поиска городов и отделений в разделе 2 документации не описаны.**

## Формат адресы согласно документации

Согласно разделу 2, таблице 2.1, адреса имеет следующую структуру:

```json
{
  "id": 530887,
  "postcode": "04071",
  "region": "Kyiv",
  "district": "Київський",
  "city": "Kyiv",
  "street": "Khoriva",
  "houseNumber": "40",
  "apartmentNumber": "20",
  "mailbox": "none",
  "description": "none",
  "countryside": false,
  "foreignStreetHouseApartment": null,
  "detailedInfo": "Україна, 04071, Kyiv, Kyiv, Khoriva 40, 20, none",
  "created": "2018-12-05T13:59:06",
  "lastModified": "2018-12-05T13:59:06",
  "country": "UA"
}
```

### Обязательные поля:
- `postcode` (String) - поштовий індекс (тільки цифри, 5 символів)

### Необязательные поля:
- `region` (String) - назва області (не більше 45 символів)
- `district` (String) - назва району (не більше 45 символів)
- `city` (String) - назва населеного пункту (не більше 45 символів)
- `street`, `houseNumber`, `apartmentNumber` и т.д.

## Как проверить актуальные endpoints

Для получения актуальной документации и проверки endpoints для поиска городов и отделений используйте:

1. **Swagger документация:**
   ```
   GET https://www.ukrposhta.ua/ecom/0.0.1/doc
   ```

2. **Онлайн документация:**
   ```
   https://dev.ukrposhta.ua/documentation
   ```

3. **Додаток Е документации:**
   В документации упоминается "Додаток Е. Специфікація Swagger для Ukrpost API" - проверьте этот раздел.

## Текущая реализация

В текущей реализации (`server/routes/ukrposhta.js`) используются следующие предположения:

### Поиск городов:
- Пробуются endpoints: `/addresses?q=...`, `/settlements?q=...`
- Если endpoints не работают, возвращаются популярные города из хардкода

### Получение отделений:
- Пробуются endpoints: `/postoffices?postalCode=...`, `/post-offices?postalCode=...`
- Если endpoints не работают, возвращается пустой массив

## Рекомендации

1. **Проверьте актуальные endpoints через Swagger:**
   - Откройте `https://www.ukrposhta.ua/ecom/0.0.1/doc` или `https://dev.ukrposhta.ua/documentation`
   - Найдите endpoints для поиска населенных пунктов (settlements, cities, addresses)
   - Найдите endpoints для получения отделений (post offices, branches)

2. **Обновите код:**
   - После проверки актуальных endpoints, обновите `server/routes/ukrposhta.js`
   - Удалите комментарии о "приблизительных" endpoints
   - Используйте точные endpoints из Swagger документации

3. **Тестирование:**
   - Протестируйте все endpoints с реальным Bearer токеном
   - Проверьте формат ответов и обновите преобразование данных при необходимости

## Настройка API ключей

Убедитесь, что в `server/.env` настроены:

```env
UKRPOSHTA_API_BASE=https://www.ukrposhta.ua/ecom/0.0.1
# или для тестового окружения:
# UKRPOSHTA_API_BASE=https://dev.ukrposhta.ua/ecom/0.0.1

UKRPOSHTA_BEARER_TOKEN=ваш_bearer_токен_из_АРІ_ключі.pdf
```

Используйте `PRODUCTION BEARER eCom` для продакшена или `SANDBOX BEARER eCom` для тестирования.

