import crypto from 'crypto';

/**
 * Генерирует подпись для WayForPay
 * @param {Object} params - Параметры платежа
 * @param {string} secretKey - Секретный ключ мерчанта
 * @returns {string} - Подпись
 */
export function generateWayForPaySignature(params, secretKey) {
  // Сортируем ключи по алфавиту и формируем строку для подписи
  const keys = Object.keys(params).sort();
  const signatureString = keys
    .map(key => `${key}=${params[key]}`)
    .join(';');
  
  return crypto
    .createHmac('md5', secretKey)
    .update(signatureString)
    .digest('hex');
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
  const products = order.items.map((item) => ({
    name: item.productName || 'Товар',
    count: item.quantity,
    price: item.price,
  }));

  // Базовая структура данных
  const orderDate = Math.floor(Date.now() / 1000);
  
  // WayForPay для UAH ожидает сумму в гривнах (не в копейках!)
  const amount = parseFloat(order.total.toFixed(2));
  
  const params = {
    merchantAccount,
    merchantDomainName,
    orderReference: order.id,
    orderDate,
    amount: amount,
    currency: 'UAH',
    productName: products.map(p => p.name).join('; '),
    productCount: products.length,
    productPrice: amount,
    serviceUrl, // URL для callback от WayForPay
    returnUrl, // URL для возврата пользователя после оплаты
    language: 'UA',
  };

  // Генерируем подпись
  const merchantSignature = generateWayForPaySignature(params, merchantSecretKey);

  return {
    ...params,
    merchantSignature,
  };
}

