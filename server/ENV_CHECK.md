# Проверка файла .env

## Ваш текущий файл:
```env
DB_HOST=idesig02.mysql.tools
DB_USER=idesig02_fetrinua
DB_PASSWORD=7%j-7EyzF8
DB_NAME=idesig02_fetrinua
DB_PORT=3306
PORT=3001
CORS_ORIGIN=http://idesig02.mysql.tools:8080
```

## Проблемы:

### ❌ CORS_ORIGIN указан неправильно
`CORS_ORIGIN=http://idesig02.mysql.tools:8080` - это адрес MySQL сервера, а не вашего сайта!

### ✅ Правильный вариант:
```env
CORS_ORIGIN=https://fetr.in.ua
```

Или если сайт работает на другом домене/порту, укажите правильный адрес фронтенда.

## Исправленный файл .env:

```env
DB_HOST=idesig02.mysql.tools
DB_USER=idesig02_fetrinua
DB_PASSWORD=7%j-7EyzF8
DB_NAME=idesig02_fetrinua
DB_PORT=3306
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://fetr.in.ua
```

## Проверка подключения:

После исправления можно проверить подключение:

```bash
# На сервере
cd /home/idesig02/fetr.in.ua/www
node server/db.js
```

Или запустить сервер и проверить health check:
```bash
npm run server
# В другом терминале
curl http://localhost:3001/api/health
```

