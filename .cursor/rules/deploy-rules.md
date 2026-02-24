# Правила деплоя fetr.in.ua

## Доступ к серверу
```
SSH:     idesig02@idesig02.ftp.tools
Проект:  /home/idesig02/fetr.in.ua/www/
Git:     https://github.com/Helgamade/fetr.in.ua.git (ветка main)
Сайт:    https://fetr.in.ua/
```

---

## Архитектура (как это работает)

```
Локально                    GitHub                  Сервер (production)
────────                    ──────                  ───────────────────
src/        ─┐                                      /www/index.html        ← из dist/index.html
server/      │  npm run build                       /www/assets/*.js       ← из dist/assets/
vite.config  │       ↓                              /www/assets/*.css
             ├─→  dist/          git add -A         /www/server/           ← Node.js API
             │    dist/index.html ──────────→ GitHub → server/deploy.sh → сервер
             │    dist/assets/    git commit
             └─   (все файлы)    git push
```

**Node.js сервер** слушает порт `3001`, обслуживает API (`/api/*`).
**Apache** обслуживает статику — `index.html` и `assets/` из корня `/www/`.
**Никакой сборки на сервере нет** — только копирование из `dist/`.

---

## ❗ ЖЕЛЕЗНОЕ ПРАВИЛО #1 — dist/ коммитится ВЕСЬ, ВСЕГДА

```
НЕЛЬЗЯ: git add dist/index.html     ← ЗАПРЕЩЕНО. Сломает сайт.
НЕЛЬЗЯ: git add src/ index.html     ← Без dist/ деплой сломается.

МОЖНО ТОЛЬКО: git add -A            ← Добавляет ВСЁ, включая dist/
```

**Почему:** Vite генерирует хеши в именах файлов (`index-CFd-NLOE.js`).
`dist/index.html` ссылается на конкретные хеши. Если в git попадёт
только `index.html` с новыми хешами, но старые `assets/*.js` — сервер
вернёт `index.html` вместо JS → ошибка `Failed to load module script`.

**Симптом нарушения:** `Failed to load module script: Expected a JavaScript module but the server responded with MIME type "text/html"`.

---

## ❗ ЖЕЛЕЗНОЕ ПРАВИЛО #2 — Стандартная последовательность (не менять!)

Каждый раз при изменении ЛЮБОГО файла в `src/`, `server/`, `vite.config.ts`, `index.html`:

```powershell
# 1. Собрать (ЛОКАЛЬНО, не на сервере)
npm run build

# 2. Закоммитить ВСЁ включая dist/
git add -A
git commit -m "краткое описание"
git push

# 3. Задеплоить
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && bash server/deploy.sh"
```

PowerShell не поддерживает `&&`. Используй `;` для цепочки команд:
```powershell
git add -A ; git commit -m "описание" ; git push
```

---

## ❗ ЖЕЛЕЗНОЕ ПРАВИЛО #3 — Проверка после деплоя

После каждого деплоя ОБЯЗАТЕЛЬНО проверить:

```powershell
# Timestamp должен совпасть с выведенным в логе deploy.sh
ssh idesig02@idesig02.ftp.tools "cat /home/idesig02/fetr.in.ua/www/DEPLOY_TIMESTAMP.txt"

# index.html должен ссылаться на assets/index-*.js, а не src/main.tsx
ssh idesig02@idesig02.ftp.tools "grep 'assets/index-' /home/idesig02/fetr.in.ua/www/index.html"
```

---

## Что делает server/deploy.sh

1. `git fetch && git reset --hard origin/main` — точная копия из Git
2. Проверяет что `dist/index.html` существует (иначе — ошибка и стоп)
3. `cp dist/index.html → index.html` — для Apache
4. `cp -r dist/assets/* → assets/` — JS/CSS бандлы
5. Права: `755` для папок, `644` для файлов
6. Перезапуск Node.js сервера (`server/index.js`)
7. Верификация через `DEPLOY_TIMESTAMP.txt`

---

## Файлы и Git

| Файл/папка     | В Git?    | Описание |
|----------------|-----------|----------|
| `src/`         | ✅ да     | Исходники React/TS |
| `server/`      | ✅ да     | Express API + deploy.sh |
| `dist/`        | ✅ **да** | Скомпилированный фронтенд — деплоится через git |
| `index.html`   | ✅ да     | Vite-шаблон (содержит `src/main.tsx`) |
| `public/`      | ✅ да     | `.htaccess`, `robots.txt` |
| `uploads/`     | ❌ нет    | Загруженные файлы (персистентные на сервере) |
| `server/.env`  | ❌ нет    | Секреты БД, JWT — никогда в git |
| `node_modules/`| ❌ нет    | Зависимости |
| `dist-ssr/`    | ❌ нет    | SSR артефакты |

---

## Диагностика ошибок

### "Failed to load module script" (MIME type text/html)
**Причина:** В git попал `dist/index.html` с новыми хешами, но `dist/assets/` остался старый.
**Исправление:**
```powershell
# Локально: пересобрать и закоммитить ВСЁ
npm run build ; git add -A ; git commit -m "fix: full dist rebuild" ; git push
# Затем задеплоить
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && bash server/deploy.sh"
```

### Сайт отдаёт старую версию
**Причина:** Деплой выполнен, но браузер кешировал.
**Исправление:** В браузере `Ctrl+Shift+R` (hard reload).

### Node.js API не отвечает (/api/*)
```bash
# Посмотреть лог
ssh idesig02@idesig02.ftp.tools "tail -50 /home/idesig02/fetr.in.ua/www/server/api.log"

# Перезапустить вручную
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && pkill -f 'node.*server/index.js'; sleep 1; nohup node --max-old-space-size=512 server/index.js > server/api.log 2>&1 &"
```

### git reset --hard конфликт
```bash
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && git fetch origin && git reset --hard origin/main && bash server/deploy.sh"
```

---

## ЗАПРЕЩЕНО

- ❌ `npm run build` на сервере
- ❌ Редактировать файлы вручную на сервере
- ❌ `git add dist/index.html` без `dist/assets/`
- ❌ `git push` без предварительного `npm run build`
- ❌ Изменять `uploads/` или `server/.env` через git
- ❌ Коммитить `node_modules/`
