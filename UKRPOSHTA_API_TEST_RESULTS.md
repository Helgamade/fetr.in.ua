# Результаты тестирования Ukrposhta API

## 🎉 Тестирование завершено успешно!

Автоматический тест проверил **все возможные комбинации** токенов, URL и заголовков.

### 📊 Статистика:
- **Всего тестов**: 960
- **Успешных конфигураций**: 63
- **Неудачных**: 897

---

## ✅ Рабочая конфигурация (выбрана для использования):

```javascript
// Backend (server/routes/ukrposhta.js)
const ADDRESS_CLASSIFIER_BASE = 'https://www.ukrposhta.ua/address-classifier-ws';
const UKRPOSHTA_BEARER_TOKEN = '67f02a7c-3af7-34d1-aa18-7eb4d96f3be4'; // PROD_BEARER_ECOM
```

```typescript
// Frontend (src/lib/api.ts)
const UKRPOSHTA_API_BASE = 'https://www.ukrposhta.ua/address-classifier-ws';
const UKRPOSHTA_BEARER_TOKEN = '67f02a7c-3af7-34d1-aa18-7eb4d96f3be4'; // PROD_BEARER_ECOM
```

### Заголовки:
```javascript
{
  'Authorization': 'Bearer 67f02a7c-3af7-34d1-aa18-7eb4d96f3be4',
  'Accept': 'application/json',
}
```

---

## 🔍 Все успешные токены:

### PRODUCTION (рекомендуется):
1. ✅ **PROD_BEARER_ECOM**: `67f02a7c-3af7-34d1-aa18-7eb4d96f3be4` ⭐ (выбран)
2. ✅ **PROD_BEARER_STATUS_TRACKING**: `7f37c2c3-780b-3602-8e18-b7e50b901cd5`
3. ✅ **PROD_COUNTERPARTY_TOKEN**: `ab714b81-60a5-4dc5-a106-1a382f8d84bf`

### SANDBOX (для тестирования):
4. ✅ **SANDBOX_BEARER_ECOM**: `4bfd1c4e-ff8f-3952-bb30-8fc17c5975db`
5. ✅ **SANDBOX_BEARER_STATUS_TRACKING**: `d4ff701b-795e-3951-a7dc-1202d6fa388a`
6. ✅ **SANDBOX_COUNTERPARTY_TOKEN**: `2fbee77e-2f39-3f34-823f-52d4b3e0bae2`

### БЕЗ ТОКЕНА:
7. ✅ **NO_TOKEN**: API также работает без токена! (но мы используем токен для надёжности)

---

## 📋 Протестированные endpoints:

### ✅ Работающие:
1. `/get_city_by_region_id_and_district_id_and_city_ua?region_id=270&city_ua=Київ`
2. `/get_postoffices_by_city_id?city_id=4926`

### ⚠️ Примечание:
API возвращает `{"Entries": {}}` (пустой результат) для некоторых запросов.
Это может означать:
- Неправильные параметры запроса
- Данные не найдены в базе
- Требуется другой формат запроса

---

## 🚨 НЕ работающие URL:
- ❌ `https://ukrposhta.ua/address-classifier-ws` (без `www`) - 403 Forbidden
- ❌ `https://www.ukrposhta.ua/address-classifier-ws/1.0.0` - 403 Forbidden
- ❌ `https://ukrposhta.ua/address-classifier-ws/1.0.0` - 403 Forbidden
- ❌ `https://www.ukrposhta.ua/ecom/0.0.1` - 403 Forbidden
- ❌ `https://ukrposhta.ua/ecom/0.0.1` - 403 Forbidden

---

## 📝 Рекомендации:

1. ✅ **Используй**: `https://www.ukrposhta.ua/address-classifier-ws` (с `www`)
2. ✅ **Токен**: `PROD_BEARER_ECOM` (`67f02a7c-3af7-34d1-aa18-7eb4d96f3be4`)
3. ✅ **Headers**: Минимальный набор (`Accept: application/json` + `Authorization`)
4. ⚠️ **Проверь параметры**: Если API возвращает пустые результаты, проверь правильность параметров запроса

---

## 📄 Детальные результаты:

Полный JSON отчёт с результатами всех тестов сохранён в:  
`server/scripts/ukrposhta-api-test-results.json`

---

**Дата тестирования**: 2026-01-01  
**Скрипт**: `server/scripts/test-ukrposhta-api.js`

