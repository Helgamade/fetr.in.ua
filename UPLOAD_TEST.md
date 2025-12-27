# Тестирование загрузки изображений

## Проблема
Файлы не загружаются на сервер в папку `uploads/products/`.

## Исправления
1. Исправлен путь для uploadsDir: `path.join(__dirname, '..', '..', 'uploads', 'products')`
2. Добавлено детальное логирование в консоль сервера
3. Добавлен тестовый endpoint `/api/products/upload-test`
4. Улучшена обработка ошибок при загрузке

## Как проверить логи сервера

На сервере выполни:
```bash
cd /home/idesig02/fetr.in.ua/www/server
# Логи сервера должны показывать:
# === MULTER CONFIG ===
# __dirname: /home/idesig02/fetr.in.ua/www/server/routes
# uploadsDir (absolute): /home/idesig02/fetr.in.ua/www/uploads/products
```

## Тестирование через админку

1. Открой https://www.fetr.in.ua/admin/products
2. Редактируй любой товар
3. Перейди на вкладку "Зображення"
4. Нажми кнопку загрузки (иконка стрелки вверх) рядом с полем URL
5. Выбери файл изображения
6. Проверь консоль браузера (F12) на наличие ошибок
7. Проверь, что появилось сообщение "Успішно Зображення завантажено"

## Тестирование через тестовый endpoint

Используй curl или Postman:

```bash
curl -X POST https://www.fetr.in.ua/api/products/upload-test \
  -F "testImage=@/path/to/image.jpg"
```

Или через браузер с формой:
```html
<form action="/api/products/upload-test" method="POST" enctype="multipart/form-data">
  <input type="file" name="testImage" />
  <button type="submit">Test Upload</button>
</form>
```

## Проверка после загрузки

1. Проверь, что файл появился на сервере:
```bash
ls -la /home/idesig02/fetr.in.ua/www/uploads/products/
```

2. Проверь, что файл доступен по URL:
```bash
curl -I https://www.fetr.in.ua/uploads/products/product-*.jpg
# Должен вернуть 200 OK
```

3. Проверь логи сервера при загрузке:
```bash
# Логи должны содержать:
# === UPLOAD REQUEST ===
# File object: { filename, path, size, ... }
# SUCCESS: File uploaded and verified
```

## Возможные проблемы

### Файл не сохраняется
- Проверь права доступа на папку: `chmod 777 /home/idesig02/fetr.in.ua/www/uploads/products`
- Проверь логи сервера на наличие ошибок
- Проверь, что путь правильный (должен быть `/home/idesig02/fetr.in.ua/www/uploads/products`)

### Файл сохраняется, но не отображается
- Проверь, что сервер статических файлов настроен: `app.use('/uploads', express.static('uploads'))`
- Проверь URL файла в ответе API (должен начинаться с `/uploads/products/`)
- Проверь права доступа на файл: `chmod 644 /home/idesig02/fetr.in.ua/www/uploads/products/*`

### Ошибка "Failed to load module script"
- Это другая проблема, связанная с деплоем фронтенда
- См. `server/deploy.sh` и `.cursor/rules/deploy-rules.md`

