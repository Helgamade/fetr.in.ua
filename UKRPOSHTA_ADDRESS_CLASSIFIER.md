# API Укрпошты - Адресный классификатор

## Обзор

Согласно документации "Рекомендації з пошуку індексів та відділень" (Search-offices-and-indexes-v3.pdf), для поиска городов и отделений используется **адресный классификатор API**, а не ecom API.

## Базовый URL

```
https://ukrposhta.ua/address-classifier-ws/
```

**Важно:** Это публичный API, который **не требует Bearer токена** для доступа.

## Процесс поиска

Согласно документации, поиск выполняется в следующем порядке:

```
Область → Район → Населенный пункт → Отделение
```

## Endpoints адресного классификатора

### 1. Поиск области

**Endpoint:** `GET /get_regions_by_region_ua?region_name={название_области}`

**Пример:**
```
GET /get_regions_by_region_ua?region_name=Київська
```

**Формат ответа:**
```json
{
  "Entries": {
    "Entry": [
      {
        "REGION_ID": "270",
        "REGION_UA": "Київська",
        "REGION_EN": "Kyivska",
        "REGION_KATOTTG": "3200000000030281",
        "REGION_KOATUU": "320000000",
        "REGION_RU": null
      }
    ]
  }
}
```

### 2. Поиск района

**Endpoint:** `GET /get_districts_by_region_id_and_district_ua?region_id={REGION_ID}&district_ua={название_района}`

**Пример:**
```
GET /get_districts_by_region_id_and_district_ua?region_id=270&district_ua=Броварський
```

**Формат ответа:**
```json
{
  "Entries": {
    "Entry": [
      {
        "REGION_ID": "270",
        "DISTRICT_ID": "339",
        "DISTRICT_UA": "Броварський",
        "DISTRICT_EN": "BROVARSKYI",
        "DISTRICT_KOATUU": "3221200000",
        "DISTRICT_KATOTTG": "32060000000012455",
        ...
      }
    ]
  }
}
```

### 3. Поиск населенного пункта

**Endpoint:** `GET /get_city_by_region_id_and_district_id_and_city_ua?district_id={DISTRICT_ID}&city_ua={название_города}`

**Пример:**
```
GET /get_city_by_region_id_and_district_id_and_city_ua?district_id=339&city_ua=Бровари
```

**Формат ответа:**
```json
{
  "Entries": {
    "Entry": [
      {
        "REGION_ID": "270",
        "DISTRICT_ID": "339",
        "CITY_ID": "10952",
        "REGION_UA": "Київська",
        "DISTRICT_UA": "Броварський",
        "CITY_UA": "Бровари",
        "CITY_EN": "Brovary",
        "CITY_KOATUU": "3210600000",
        "CITY_KATOTTG": "32060050010081797",
        "POSTCODE": "07401",
        ...
      }
    ]
  }
}
```

**Важные поля:**
- `CITY_ID` - идентификатор населенного пункта (используется для получения отделений)
- `CITY_UA` - название населенного пункта на украинском
- `POSTCODE` - почтовый индекс (может быть пустым для населенного пункта)
- `CITY_KATOTTG` - код классификатора (альтернативный способ получения отделений)

### 4. Получение отделений

**Endpoint 1:** `GET /get_postoffices_by_city_id?city_id={CITY_ID}`

**Endpoint 2:** `GET /get_postoffices_by_katottg?katottg={CITY_KATOTTG}`

**Пример:**
```
GET /get_postoffices_by_city_id?city_id=10952
```

**Формат ответа:**
```json
{
  "Entries": {
    "Entry": [
      {
        "POSTOFFICE_ID": "12345",
        "POSTOFFICE_UA": "Відділення №1",
        "POSTOFFICE_EN": "Post Office #1",
        "POSTCODE": "07401",
        "ADDRESS_UA": "вул. Київська, 1",
        "ADDRESS_EN": "Kyivska str., 1",
        "CITY_ID": "10952",
        ...
      }
    ]
  }
}
```

**Важные поля:**
- `POSTOFFICE_ID` - идентификатор отделения
- `POSTOFFICE_UA` - название отделения на украинском
- `POSTCODE` - почтовый индекс отделения
- `ADDRESS_UA` - адрес отделения

## Реализация в коде

### Backend (`server/routes/ukrposhta.js`)

1. **Функция вызова API:**
   ```javascript
   async function callAddressClassifierAPI(endpoint) {
     const url = `https://ukrposhta.ua/address-classifier-ws${endpoint}`;
     // Публичный API, не требует токена
   }
   ```

2. **Поиск городов:**
   - Пробует поиск по названию без region_id
   - Если не работает, ищет в популярных областях
   - Возвращает города с `CITY_ID` для получения отделений

3. **Получение отделений:**
   - Использует `GET /get_postoffices_by_city_id?city_id={CITY_ID}`
   - Требует `cityId` (CITY_ID) в query параметрах

### Frontend (`src/lib/api.ts`)

Интерфейсы обновлены для поддержки `cityId`:
```typescript
export interface UkrposhtaCity {
  id: string; // CITY_ID
  name: string; // CITY_UA
  postalCode: string; // POSTCODE
  region?: string; // REGION_UA
  district?: string; // DISTRICT_UA
  cityId?: string; // CITY_ID (для получения отделений)
}
```

### Компонент (`src/components/UkrPoshtaDelivery.tsx`)

Использует `cityId` (или `id` как fallback) для получения отделений:
```typescript
const cityIdForBranches = selectedCity.cityId || selectedCity.id;
ukrposhtaAPI.getBranches(cityIdForBranches);
```

## Важные замечания

1. **Адресный классификатор vs ecom API:**
   - Адресный классификатор - для поиска городов и отделений (публичный API)
   - ecom API - для создания адресы, клиентов, отправлений (требует Bearer токен)

2. **CITY_ID обязателен:**
   - Для получения отделений обязательно нужен `CITY_ID` из адресного классификатора
   - `postalCode` не используется напрямую для получения отделений

3. **Поиск городов:**
   - Для точного поиска нужно указать `region_id` и `district_id`
   - Для простого поиска по названию можно искать в популярных областях
   - В текущей реализации используется упрощенный подход

4. **Населенные пункты с одинаковыми названиями:**
   - В одном районе может быть несколько населенных пунктов с одинаковым названием
   - Каждый имеет свой `CITY_ID`
   - Необходимо учитывать `DISTRICT_ID` и `REGION_ID` для точной идентификации

## Документация

- **Рекомендації з пошуку індексів та відділень:** Search-offices-and-indexes-v3.pdf
- **Адресный классификатор:** Address-classifier-v3.20-09122024.pdf
- **API ecom:** API-інструкція.pdf (раздел 2 "Адреса")

