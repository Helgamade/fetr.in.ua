# Правила деплоя fetr.in.ua

## Доступ к серверу
```
SSH: idesig02@idesig02.ftp.tools
Проект: /home/idesig02/fetr.in.ua/www/
Git: https://github.com/Helgamade/fetr.in.ua.git (ветка main)
```

---

## Как это работает (правильная архитектура)

```
Локальная машина                  GitHub                  Сервер
─────────────────                 ───────                 ──────
src/ (исходники)                                          dist/ (из git)
    ↓ npm run build               git push                    ↓ cp
dist/ (скомпилированный)  ──────────────────────→  index.html + assets/
    ↓ git add dist/               
    ↓ git commit                                    (никакого npm run build!)
    ↓ git push
```

**Ключевой принцип:** `npm run build` выполняется **ТОЛЬКО ЛОКАЛЬНО**. Сервер получает уже собранный `dist/` из git и просто копирует файлы.

Это устраняет проблему "4 модулей вместо 2795" навсегда — сервер никогда не запускает Vite.

---

## Стандартный деплой

### Шаг 1 — локально (любые изменения в коде):
```powershell
cd "e:\fetr.in.ua\www"

# Сборка
npm run build

# Коммит (включая dist/)
git add -A
git commit -m "описание изменений"
git push origin main
```

### Шаг 2 — на сервере:
```powershell
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && bash server/deploy.sh"
```

`server/deploy.sh` делает:
1. `git fetch && git reset --hard origin/main` — точная копия из Git
2. `cp dist/index.html → index.html` — для Apache
3. `cp dist/assets/* → assets/` — JS/CSS бандлы
4. Права доступа (755/644)
5. Перезапуск Node.js сервера

---

## Что НЕ нужно делать

- ❌ НЕ запускать `npm run build` на сервере
- ❌ НЕ делать `git checkout -- index.html` (больше не нужно)
- ❌ НЕ редактировать файлы вручную на сервере
- ❌ НЕ пушить без предварительного `npm run build` локально

---

## Файлы в Git

| Файл/папка | В Git? | Описание |
|---|---|---|
| `src/` | ✅ да | Исходники React/TS |
| `server/` | ✅ да | Express API |
| `dist/` | ✅ **да** | Скомпилированный фронтенд — деплоится через git |
| `index.html` | ✅ да | Исходный Vite шаблон (`/src/main.tsx`) |
| `public/` | ✅ да | robots.txt, .htaccess |
| `uploads/` | ❌ нет | Загружаемые файлы, персистентные |
| `server/.env` | ❌ нет | Секреты, никогда в git |
| `node_modules/` | ❌ нет | Зависимости |

---

## Проверка деплоя

```bash
# Timestamp на сайте должен совпадать с выведенным в логе deploy.sh
curl -s "https://fetr.in.ua/DEPLOY_TIMESTAMP.txt"

# Проверить что JS бандл из dist/ используется (не src/main.tsx!)
ssh idesig02@idesig02.ftp.tools "grep 'assets/index-' /home/idesig02/fetr.in.ua/www/index.html"
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

## Если deploy.sh упал с ошибкой git (конфликт)

```bash
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && git fetch origin && git reset --hard origin/main && bash server/deploy.sh"
```

---

## Чеклист перед деплоем

- [ ] `npm run build` выполнен локально — `✓ 2795 modules transformed`
- [ ] `dist/index.html` содержит `/assets/index-*.js` (не `/src/main.tsx`)
- [ ] `git push origin main` выполнен
- [ ] `bash server/deploy.sh` завершился без ошибок
- [ ] Timestamp на сайте совпадает
