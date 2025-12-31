# Настройка API

## Структура файлов .env

### 1. `server/.env` (для бэкенда)
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
```

**Важно:** `VITE_API_URL` НЕ должен быть здесь!

### 2. `.env` в корне проекта (для фронтенда)

**ВАЖНО:** В коде `src/lib/api.ts` используется захардкоженное значение `API_BASE_URL = '/api'`. Переменная окружения `VITE_API_URL` не используется в коде.

```env
# В коде используется захардкоженное значение '/api'
# Дополнительная настройка не требуется
```

## Настройка Apache Proxy

Файл `.htaccess` настроен для проксирования запросов `/api/*` на внутренний адрес Node.js сервера (`http://127.1.5.169:3000/api/*`).

**Важно:** На хостинге проксирование может быть настроено через панель управления. В этом случае правило в `.htaccess` может не работать или конфликтовать. Проверьте настройки проксирования в панели хостинга.

### Требования:
- Модуль `mod_rewrite` должен быть включен
- Модуль `mod_proxy` должен быть включен
- Модуль `mod_proxy_http` должен быть включен

### Проверка модулей:
```bash
# На сервере
apache2ctl -M | grep proxy
apache2ctl -M | grep rewrite
```

Если модули не включены, обратитесь к администратору хостинга или добавьте в конфигурацию Apache:
```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule rewrite_module modules/mod_rewrite.so
```

## Альтернативный вариант (если проксирование не работает)

Если проксирование через `.htaccess` не работает, можно использовать прямой доступ к порту:

1. Измените `.env` в корне:
```env
VITE_API_URL=https://fetr.in.ua:3001/api
```

2. Убедитесь, что порт 3001 доступен извне (может потребоваться настройка файрвола)

## Проверка работы API

### На сервере (внутренний доступ):
```bash
curl http://127.1.5.169:3000/api/health
```

### Через прокси (с фронтенда):
```bash
curl https://fetr.in.ua/api/health
```

### Проверка в браузере:
Откройте консоль разработчика (F12) и выполните:
```javascript
fetch('/api/health').then(r => r.json()).then(console.log)
```

## Запуск сервера

```bash
cd /home/idesig02/fetr.in.ua/www
./server/start.sh
```

## Автозапуск при перезагрузке

Добавьте в crontab:
```bash
crontab -e
# Добавьте строку:
@reboot cd /home/idesig02/fetr.in.ua/www && /home/idesig02/fetr.in.ua/www/server/start.sh
```

