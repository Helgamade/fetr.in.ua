# Правила сборки проекта FetrInUA

## Требования к сборке frontend

### ✅ Обязательно:
1. **Версионирование (hash)** - файлы должны иметь уникальный hash для обхода кэша браузера
2. **Оптимизация** - код должен быть оптимизирован для продакшена
3. **Source maps** - для отладки (опционально, можно отключить в продакшене)

### ❌ НЕ делать:
- Коммитить `node_modules/`
- Коммитить `.env*` файлы
- Коммитить `dist/` без предварительной сборки

---

## Настройка Vite

### vite.config.ts:
- Использует `@vitejs/plugin-react-swc` для быстрой сборки
- Алиас `@/` для импортов из `src/`
- Порт разработки: 8080

### Режимы сборки:
- **Development**: `npm run dev` - быстрая разработка с HMR
- **Production**: `npm run build` - оптимизированная сборка в `dist/`

---

## Команда сборки

### Development:
```bash
npm run dev
```
- Запускает dev сервер на `http://localhost:8080`
- Hot Module Replacement (HMR)
- Быстрая перезагрузка при изменениях

### Production:
```bash
npm run build
```
- Собирает оптимизированную версию в `dist/`
- Минифицирует код
- Оптимизирует assets
- Генерирует hash для cache busting

### Preview:
```bash
npm run preview
```
- Предпросмотр production сборки локально
- Полезно для проверки перед деплоем

---

## Результат сборки

После `npm run build` должны быть созданы:

### 1. dist/index.html
- Ссылается на `/assets/index-*.js` (скомпилированный файл)
- **КРИТИЧНО:** Этот файл должен быть скопирован в корень на сервере!

### 2. dist/assets/index-*.js
- Минифицированный JavaScript
- Hash в имени файла для cache busting
- Оптимизированный код

### 3. dist/assets/index-*.css
- Минифицированный CSS
- Hash в имени файла для cache busting

### 4. dist/assets/*.svg, *.jpg, *.png
- Оптимизированные изображения и иконки

---

## Проверка после сборки

### На локальной машине:
```powershell
# Проверить что dist/ создан
Test-Path dist

# Проверить содержимое dist/index.html
Get-Content dist\index.html | Select-String "index-.*\.js"

# Проверить размер assets
Get-ChildItem dist\assets\ | Measure-Object -Property Length -Sum
```

### На сервере:
```bash
# Проверить что dist/ существует
ls -la dist/

# Проверить содержимое dist/index.html
grep -E 'main\.tsx|index-.*\.js' dist/index.html

# Проверить размер assets
du -sh dist/assets/
```

---

## Деплой на сервер

### ⚠️ КРИТИЧНО: Файлы сохраняются ТОЛЬКО в `/home/idesig02/fetr.in.ua/www/`!

**В корень `/home/idesig02/fetr.in.ua/` НИЧЕГО не копируется!**

### Файлы для копирования:
1. ✅ `dist/index.html` → `www/index.html` (КРИТИЧНО!)
2. ✅ `dist/assets/*` → `www/assets/`
3. ✅ `dist/public/*` → `www/public/` (если есть)

### После копирования на сервере:
```bash
# Установить права доступа
chmod 755 www/assets
chmod 644 www/assets/*
chmod 644 www/index.html
chmod 644 www/public/* 2>/dev/null || true
```

### В браузере:
- **Ctrl+Shift+R** (жёсткая перезагрузка)
- F12 → Network → проверить что загружаются `/assets/index-*.js`
- F12 → Sources → проверить что файлы минифицированы

---

## Troubleshooting

### Проблема: Браузер загружает старый файл
**Решение:** 
- Проверь что hash в URL изменился
- Очисти кэш браузера (Ctrl+Shift+Delete)
- Проверь что `index.html` обновлен на сервере

### Проблема: Ошибка "Failed to load module script"
**Решение:** 
- Проверь что `www/index.html` скопирован из `dist/index.html`
- Проверь что `www/index.html` ссылается на `/assets/index-*.js`, а не на `/src/main.tsx`
- Выполни: `cp dist/index.html www/index.html` на сервере

### Проблема: Файлы не минифицированы
**Решение:** 
- Проверь что используется `npm run build` (не `npm run dev`)
- Проверь что `NODE_ENV=production` установлен

---

_Создано: 2025-01-XX_  
_Последнее обновление: 2025-01-XX_


