import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const SECRET_KEY = process.env.WAYFORPAY_SECRET_KEY || '77cbf18313c8c17e70ffe4bfad6b50fa37bb8ef5';

function generateSignature(params, secretKey) {
  const keys = Object.keys(params).sort();
  const signatureString = keys
    .map(key => `${key}=${String(params[key])}`)
    .join(';');
  
  console.log('\n=== Строка для подписи ===');
  console.log(signatureString);
  console.log('\n=== Длина строки (байты) ===');
  console.log(Buffer.from(signatureString, 'utf8').length);
  console.log('\n=== Байты строки (первые 100) ===');
  console.log(Array.from(Buffer.from(signatureString, 'utf8').slice(0, 100)));
  
  const signature = crypto
    .createHmac('md5', secretKey)
    .update(signatureString, 'utf8')
    .digest('hex');
  
  return signature;
}

// Тестовые данные как в логах
const testParams = {
  merchantAccount: 'www_fetr_in_ua',
  merchantDomainName: 'fetr.in.ua',
  orderReference: 'ORD-1767220235533-1BXZQYOEJ',
  orderDate: '1767220236',
  amount: '915.00',
  currency: 'UAH',
  productName: 'Базовий',
  productCount: '1',
  productPrice: '915.00',
  serviceUrl: 'https://fetr.in.ua/api/wayforpay/callback',
  returnUrl: 'https://fetr.in.ua/thank-you',
  language: 'UA',
};

console.log('=== Тестовые параметры ===');
console.log(JSON.stringify(testParams, null, 2));

console.log('\n=== Используемый Secret Key ===');
console.log(SECRET_KEY);
console.log('Длина:', SECRET_KEY.length);

const signature = generateSignature(testParams, SECRET_KEY);

console.log('\n=== Сгенерированная подпись ===');
console.log(signature);
console.log('\n=== Ожидаемая подпись (из логов) ===');
console.log('bc03f5b0cc5821d9426726e917bf3411');
console.log('\n=== Совпадают? ===');
console.log(signature === 'bc03f5b0cc5821d9426726e917bf3411' ? 'ДА' : 'НЕТ');

