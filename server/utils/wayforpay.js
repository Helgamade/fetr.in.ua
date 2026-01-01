import crypto from 'crypto';

/**
 * Генерирует подпись для WayForPay Purchase API
 * 
 * Документация: https://wiki.wayforpay.com/uk/view/852102
 * 
 * Алгоритм генерации подписи согласно документации:
 * 1. Строка формируется объединением параметров через точку с запятой (;)
 * 2. Порядок параметров (строгий, НЕ по алфавиту):
 *    merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;
 *    productName[0];productName[1];...;productName[n];
 *    productCount[0];productCount[1];...;productCount[n];
 *    productPrice[0];productPrice[1];...;productPrice[n]
 * 3. serviceUrl и returnUrl НЕ входят в подпись!
 * 4. Применяется HMAC-MD5 с использованием SecretKey
 * 
 * @param {Object} params - Параметры платежа (с массивами productName, productCount, productPrice)
 * @param {string} secretKey - Секретный ключ мерчанта
 * @returns {string} - Подпись в формате hex
 */
export function generateWayForPaySignature(params, secretKey) {
  
  const parts = [];
  
  // Базовые поля в строгом порядке
  parts.push(String(params.merchantAccount));
  parts.push(String(params.merchantDomainName));
  parts.push(String(params.orderReference));
  parts.push(String(params.orderDate));
  parts.push(String(params.amount));
  parts.push(String(params.currency));
  
  // productName - массив (каждый элемент отдельно)
  if (Array.isArray(params.productName)) {
    params.productName.forEach(name => parts.push(String(name)));
  } else {
    // Если передан как массив продуктов
    parts.push(String(params.productName));
  }
  
  // productCount - массив (каждый элемент отдельно)
  if (Array.isArray(params.productCount)) {
    params.productCount.forEach(count => parts.push(String(count)));
  } else {
    parts.push(String(params.productCount));
  }
  
  // productPrice - массив (каждый элемент отдельно)
  if (Array.isArray(params.productPrice)) {
    params.productPrice.forEach(price => parts.push(String(price)));
  } else {
    parts.push(String(params.productPrice));
  }
  
  const signatureString = parts.join(';');
  
  console.log('[WayForPay] Signature string:', signatureString);
  
  // Важно: используем строку, а не Buffer для secretKey
  const signature = crypto
    .createHmac('md5', secretKey)
    .update(signatureString, 'utf8')
    .digest('hex');
  
  console.log('[WayForPay] Generated signature:', signature);
  
  return signature;
}

/**
 * Валидирует подпись от WayForPay для callback
 * Согласно документации: merchantAccount;orderReference;amount;currency;authCode;cardPan;transactionStatus;reasonCode
 * @param {Object} params - Параметры из callback
 * @param {string} secretKey - Секретный ключ мерчанта
 * @param {string} receivedSignature - Полученная подпись
 * @returns {boolean} - true если подпись валидна
 */
export function validateWayForPayCallbackSignature(params, secretKey, receivedSignature) {
  // Формируем строку для подписи согласно документации WayForPay
  // merchantAccount;orderReference;amount;currency;authCode;cardPan;transactionStatus;reasonCode
  const parts = [
    String(params.merchantAccount || ''),
    String(params.orderReference || ''),
    String(params.amount || ''),
    String(params.currency || ''),
    String(params.authCode || ''),
    String(params.cardPan || ''),
    String(params.transactionStatus || ''),
    String(params.reasonCode || ''),
  ];
  
  const signatureString = parts.join(';');
  
  console.log('[WayForPay] Callback signature string:', signatureString);
  
  const calculatedSignature = crypto
    .createHmac('md5', secretKey)
    .update(signatureString, 'utf8')
    .digest('hex');
  
  console.log('[WayForPay] Calculated callback signature:', calculatedSignature);
  console.log('[WayForPay] Received callback signature:', receivedSignature);
  
  return calculatedSignature === receivedSignature;
}

/**
 * Генерирует подпись для ответа на callback
 * Согласно документации: orderReference;status;time
 * @param {string} orderReference - Номер заказа
 * @param {string} status - Статус ответа (обычно "accept")
 * @param {number} time - Время в секундах (Unix timestamp)
 * @param {string} secretKey - Секретный ключ мерчанта
 * @returns {string} - Подпись в формате hex
 */
export function generateWayForPayResponseSignature(orderReference, status, time, secretKey) {
  const signatureString = `${orderReference};${status};${time}`;
  
  const signature = crypto
    .createHmac('md5', secretKey)
    .update(signatureString, 'utf8')
    .digest('hex');
  
  return signature;
}

/**
 * Формирует данные для платежа WayForPay
 * @param {Object} order - Данные заказа
 * @param {Object} config - Конфигурация WayForPay
 * @returns {Object} - Данные для формы WayForPay
 */
export function buildWayForPayData(order, config) {
  const {
    merchantAccount,
    merchantSecretKey,
    merchantDomainName,
    returnUrl,
    serviceUrl,
  } = config;

  // Формируем список товаров для WayForPay
  const products = order.items.map((item) => {
    const price = parseFloat(item.price);
    return {
      name: item.productName || 'Товар',
      count: item.quantity,
      // Форматируем цену: если целое число - без .00, иначе с двумя знаками
      price: price % 1 === 0 ? price.toString() : price.toFixed(2),
    };
  });

  // Базовая структура данных
  const orderDate = Math.floor(Date.now() / 1000);
  
  // WayForPay для UAH ожидает сумму в гривнах с двумя знаками после запятой (например, "915.00")
  const amount = order.total.toFixed(2);
  
  // Параметры для подписи (в строгом порядке, без serviceUrl и returnUrl!)
  const paramsForSignature = {
    merchantAccount,
    merchantDomainName,
    orderReference: order.id,
    orderDate: orderDate.toString(),
    amount: amount,
    currency: 'UAH',
    // Массивы для товаров - каждый элемент отдельно!
    productName: products.map(p => p.name),
    productCount: products.map(p => p.count.toString()),
    productPrice: products.map(p => p.price),
  };
  
  // Генерируем подпись ТОЛЬКО из paramsForSignature (без serviceUrl и returnUrl!)
  const merchantSignature = generateWayForPaySignature(paramsForSignature, merchantSecretKey);

  // Возвращаем полные данные для формы (включая serviceUrl и returnUrl, но они НЕ в подписи)
  const result = {
    merchantAccount,
    merchantDomainName,
    orderReference: order.id,
    orderDate: orderDate.toString(),
    amount: amount,
    currency: 'UAH',
    // Для формы используем массивы productName[], productPrice[], productCount[]
    productName: products.map(p => p.name),
    productPrice: products.map(p => p.price),
    productCount: products.map(p => p.count.toString()),
    serviceUrl, // URL для callback от WayForPay (НЕ в подписи!)
    returnUrl, // URL для возврата пользователя после оплаты (НЕ в подписи!)
    language: 'UA',
    merchantSignature,
  };
  
  console.log('[buildWayForPayData] returnUrl from config:', returnUrl);
  console.log('[buildWayForPayData] returnUrl in result:', result.returnUrl);
  
  return result;
}

