#!/bin/bash
# =============================================================================
# deploy.sh — деплой fetr.in.ua на production сервер
#
# КАК ИСПОЛЬЗОВАТЬ:
#   ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua/www && bash server/deploy.sh"
#
# ЧТО ДЕЛАЕТ:
#   1. git reset --hard origin/main  — получает точную копию того что в Git
#   2. Копирует dist/index.html → index.html  (для Apache)
#   3. Копирует dist/assets/* → assets/       (JS/CSS бандлы)
#   4. Перезапускает Node.js API сервер
#
# ВАЖНО:
#   - npm run build выполняется ЛОКАЛЬНО перед git push, НЕ на сервере
#   - dist/ зафиксирован в Git — сервер получает уже собранный фронтенд
#   - uploads/ и server/.env в .gitignore — git reset их никогда не трогает
# =============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

DEPLOY_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DEPLOY_TIMESTAMP_FILE="$PROJECT_ROOT/DEPLOY_TIMESTAMP.txt"

echo ""
echo "=== DEPLOYMENT STARTED ==="
echo "Project root: $PROJECT_ROOT"
echo "Branch: $(git branch --show-current)"
echo "Current commit before pull: $(git log --oneline -1)"

# ── 1. Получаем последний код из Git ─────────────────────────────────────────
echo ""
echo "Fetching latest code from Git..."
git fetch origin main

# Сбрасываем всё до состояния origin/main.
# uploads/ и server/.env в .gitignore — они не затрагиваются.
git reset --hard origin/main

echo "New commit: $(git log --oneline -1)"

# ── 2. Проверяем, что dist/ есть ─────────────────────────────────────────────
if [ ! -f "dist/index.html" ]; then
  echo ""
  echo "ERROR: dist/index.html not found!"
  echo "Run 'npm run build' locally, commit dist/, and push before deploying."
  exit 1
fi

# ── 3. Копируем скомпилированный фронтенд ────────────────────────────────────
echo ""
echo "Copying compiled frontend from dist/..."

mkdir -p assets

# Очищаем старые бандлы
rm -f assets/index-*.js assets/index-*.css 2>/dev/null || true

# index.html для Apache (скомпилированная версия со ссылками на /assets/...)
cp -f dist/index.html index.html

# JS/CSS бандлы
if [ -d "dist/assets" ]; then
  cp -r dist/assets/* assets/
else
  echo "ERROR: dist/assets/ not found!"
  exit 1
fi

# .htaccess (если обновился)
if [ -f "public/.htaccess" ]; then
  cp -f public/.htaccess .htaccess
fi

# ── 4. Права доступа ─────────────────────────────────────────────────────────
echo "Setting permissions..."
chmod 755 assets/
chmod 644 index.html
find assets/ -type f -exec chmod 644 {} \;

# ── 5. Timestamp деплоя ───────────────────────────────────────────────────────
echo "$DEPLOY_TIMESTAMP" > "$DEPLOY_TIMESTAMP_FILE"
chmod 644 "$DEPLOY_TIMESTAMP_FILE"

# ── 6. Перезапуск Node.js API ─────────────────────────────────────────────────
echo ""
echo "Restarting Node.js API server..."
pkill -f "node.*server/index.js" || true
sleep 1
nohup node --max-old-space-size=512 server/index.js > server/api.log 2>&1 &
sleep 2
if pgrep -f "node.*server/index.js" > /dev/null; then
  echo "Node.js server started (PID: $(pgrep -f 'node.*server/index.js'))"
else
  echo "WARNING: Node.js server may not have started. Check server/api.log"
fi

# ── 7. Проверка ───────────────────────────────────────────────────────────────
echo ""
echo "Verifying deployment..."

# Проверяем что index.html ссылается на скомпилированный JS, не на src/main.tsx
if grep -q "main.tsx" index.html; then
  echo "ERROR: index.html still references main.tsx — dist/ in git is outdated!"
  echo "Run 'npm run build && git add dist/ && git commit && git push' locally."
  exit 1
fi

if ! grep -q "assets/index-" index.html; then
  echo "ERROR: index.html doesn't reference compiled JS!"
  exit 1
fi

# Проверяем timestamp на сайте
VERIFY_URL="https://fetr.in.ua/DEPLOY_TIMESTAMP.txt"
sleep 3
REMOTE_TIMESTAMP=$(curl -s "$VERIFY_URL?t=$(date +%s)" 2>/dev/null | head -1 | tr -d '\r\n' || echo "")

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "🕐 Deploy timestamp : $DEPLOY_TIMESTAMP"
echo "🌐 Remote timestamp : $REMOTE_TIMESTAMP"

if [ "$REMOTE_TIMESTAMP" = "$DEPLOY_TIMESTAMP" ]; then
  echo "✅ Verified — timestamps match!"
else
  echo "⚠ Timestamps differ (may be CDN cache). Check manually:"
  echo "   curl -s 'https://fetr.in.ua/DEPLOY_TIMESTAMP.txt'"
fi

echo ""
echo "Commit deployed: $(git log --oneline -1)"
