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
 * Валидирует подпись от WayForPay
 * @param {Object} params - Параметры из callback
 * @param {string} secretKey - Секретный ключ мерчанта
 * @param {string} receivedSignature - Полученная подпись
 * @returns {boolean} - true если подпись валидна
 */
export function validateWayForPaySignature(params, secretKey, receivedSignature) {
  // Удаляем merchantSignature из параметров для проверки
  const paramsForSign = { ...params };
  delete paramsForSign.merchantSignature;
  
  const calculatedSignature = generateWayForPaySignature(paramsForSign, secretKey);
  return calculatedSignature === receivedSignature;
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
  return {
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
}

