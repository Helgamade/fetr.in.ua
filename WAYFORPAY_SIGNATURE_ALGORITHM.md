# Алгоритм генерации подписи WayForPay Purchase API

## Источник документации

Официальная документация WayForPay:
- Purchase API: https://wiki.wayforpay.com/uk/view/852102
- Общий раздел: https://wiki.wayforpay.com/uk

## Алгоритм генерации merchantSignature

### 1. Формирование строки для подписи

Строка формируется объединением параметров через точку с запятой (`;`) в **строгом порядке**:

```
merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;
productName[0];productName[1];...;productName[n];
productCount[0];productCount[1];...;productCount[n];
productPrice[0];productPrice[1];...;productPrice[n]
```

### 2. Порядок параметров (обязательный!)

1. `merchantAccount` - логин мерчанта
2. `merchantDomainName` - доменное имя магазина
3. `orderReference` - уникальный номер заказа
4. `orderDate` - дата заказа (UNIX timestamp, строка)
5. `amount` - общая сумма заказа (формат: "915.00" для UAH)
6. `currency` - валюта ("UAH")
7. `productName[0]` ... `productName[n]` - названия всех товаров (каждый элемент массива отдельно)
8. `productCount[0]` ... `productCount[n]` - количества всех товаров (каждый элемент массива отдельно)
9. `productPrice[0]` ... `productPrice[n]` - цены всех товаров (каждый элемент массива отдельно)

### 3. Параметры, которые НЕ входят в подпись

- `serviceUrl` - URL для callback (не в подписи!)
- `returnUrl` - URL для возврата пользователя (не в подписи!)
- `language` - язык интерфейса (не в подписи!)
- `merchantSignature` - сама подпись (не в подписи!)
- Любые другие параметры, не указанные выше

### 4. Генерация HMAC-MD5

После формирования строки применяется алгоритм HMAC-MD5 с использованием SecretKey:

```javascript
const signature = crypto
  .createHmac('md5', secretKey)
  .update(signatureString, 'utf8')
  .digest('hex');
```

### 5. Форматирование значений

- Все значения должны быть строками
- `orderDate` - UNIX timestamp в виде строки (например, "1415379863")
- `amount` - сумма с двумя знаками после запятой (например, "915.00")
- `productPrice` - цены товаров:
  - Целые числа без `.00` (например, "1000")
  - Дробные числа с двумя знаками (например, "547.36")
- `productCount` - целые числа в виде строк (например, "1", "2")
- `productName` - строки (поддерживается UTF-8, кириллица)

### 6. Пример строки для подписи

```
www_fetr_in_ua;fetr.in.ua;ORD-12345;1415379863;1547.36;UAH;Процесор Intel Core i5-4670 3.4GHz;Kingston DDR3-1600 4096MB PC3-12800;1;1;1000;547.36
```

### 7. Важные замечания

1. **Порядок имеет значение!** Параметры должны быть в строгом порядке, указанном выше
2. **НЕ сортировать по алфавиту!** Используется фиксированный порядок
3. **Массивы разворачиваются** - каждый элемент productName, productCount, productPrice добавляется отдельно
4. **serviceUrl и returnUrl НЕ включаются** в строку подписи
5. **Кодировка UTF-8** - все строки должны быть в UTF-8
6. **Все значения - строки** - даже числа должны быть преобразованы в строки перед объединением

## Реализация в коде

См. `server/utils/wayforpay.js` - функция `generateWayForPaySignature()`

