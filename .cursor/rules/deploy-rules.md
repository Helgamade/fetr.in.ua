# Правила деплоя fetr.in.ua

## Доступ к серверу

```
SSH: idesig02@idesig02.ftp.tools
Проект: /home/idesig02/fetr.in.ua/www/
Git: https://github.com/Helgamade/fetr.in.ua.git (ветка main)
```

---

## Стандартный деплой (одна команда на сервере)

### Шаг 1 — локально (изменения в коде):
```powershell
cd "e:\fetr.in.ua\www"
git add -A
git commit -m "описание изменений"
git push origin main
```

### Шаг 2 — задеплоить на сервер:
```powershell
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && bash server/deploy.sh"
```

Скрипт `server/deploy.sh` делает ВСЁ сам:
1. `git checkout -- index.html` — восстанавливает исходный index.html (КРИТИЧНО, см. ниже)
2. `git pull origin main` — скачивает новый код
3. `npm run build` — сборка (должно быть ~2795 modules transformed)
4. Копирует `dist/` файлы в корень сайта
5. Перезапускает Node.js сервер

---

## Что НЕ нужно делать

- НЕ собирать фронтенд локально и не коммитить `dist/` — `dist/` убран из git, сборка происходит НА СЕРВЕРЕ
- НЕ делать `git reset --hard` на сервере — используй только `git pull`
- НЕ редактировать файлы вручную на сервере

---

## Файлы защищённые от перезаписи деплоем

`uploads/` и `server/.env` находятся в `.gitignore` и НЕ отслеживаются Git.
`git pull` их никогда не трогает. Они живут вечно в `/home/idesig02/fetr.in.ua/www/`.

---

## КРИТИЧЕСКАЯ ПРОБЛЕМА: Vite собирает только 4 модуля вместо ~2795

**Симптом:** В логе сборки написано `✓ 4 modules transformed` вместо `✓ 2795 modules transformed`.
Новый код в JS-бандл НЕ ПОПАДАЕТ. Сайт показывает старую версию.

**Причина:** `deploy.sh` копирует скомпилированный `dist/index.html` → `index.html`.
Скомпилированный `index.html` содержит `<script src="/assets/index-HASH.js">`.
На следующем билде Vite читает этот `index.html` и берёт старый скомпилированный JS как точку входа
вместо `src/main.tsx`.

**Решение (уже встроено в deploy.sh):**
```bash
git checkout -- index.html  # восстанавливает: <script src="/src/main.tsx">
npm run build               # теперь собирает правильно
```

**Если вдруг всё равно 4 модуля — выполни вручную:**
```bash
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && git checkout -- index.html && npm run build 2>&1 | grep 'modules transformed'"
```

---

## Проверка деплоя

```bash
# Что сейчас на сайте (актуальный ли бандл)
ssh idesig02@idesig02.ftp.tools "curl -s https://fetr.in.ua/DEPLOY_TIMESTAMP.txt"

# Какой JS-файл используется
ssh idesig02@idesig02.ftp.tools "curl -s https://fetr.in.ua/index.html | grep 'assets/index-'"

# Есть ли нужный код в бандле
ssh idesig02@idesig02.ftp.tools "grep -c 'КЛЮЧЕВАЯ_СТРОКА' /home/idesig02/fetr.in.ua/www/assets/index-*.js"
```

---

## Если деплой упал с ошибкой git pull (конфликт)

Если на сервере есть локально изменённые отслеживаемые файлы (например `index.html` уже
перезаписан и конфликтует):
```bash
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && git checkout -- . && bash server/deploy.sh"
```

---

## Структура проекта

```
www/
├── src/           ← React/TS исходники (отслеживается Git)
├── server/        ← Express API (отслеживается Git)
│   ├── index.js   ← точка входа сервера
│   ├── .env       ← секреты, НЕ в Git, никогда не трогать
│   └── deploy.sh  ← скрипт деплоя
├── public/        ← статика (robots.txt, .htaccess) (отслеживается Git)
├── index.html     ← ИСХОДНЫЙ Vite шаблон со <script src="/src/main.tsx">
│                     ВАЖНО: должен содержать /src/main.tsx, не /assets/
├── assets/        ← скомпилированный JS/CSS (НЕ в Git, генерируется при деплое)
├── dist/          ← временная папка сборки (НЕ в Git)
└── uploads/       ← загруженные файлы (НЕ в Git, никогда не трогать)
```

---

## Сервер Node.js

```
Процесс: node --max-old-space-size=512 server/index.js
Лог:     /home/idesig02/fetr.in.ua/www/server/api.log
Порт:    3001 (проксируется Apache через .htaccess)

Перезапуск вручную:
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && pkill -f 'node.*server/index.js'; sleep 1; nohup node --max-old-space-size=512 server/index.js > server/api.log 2>&1 &"
```

---

## Чеклист перед деплоем

- [ ] Код работает локально
- [ ] `git push origin main` выполнен
- [ ] `bash server/deploy.sh` показал `✓ 2795 modules transformed` (не 4!)
- [ ] `✓ Files verified on website - timestamp matches` в конце лога
- [ ] Проверить сайт в браузере
