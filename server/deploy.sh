#!/bin/bash
# Скрипт для деплоя фронтенда после обновления кода
# Использование: cd /home/idesig02/fetr.in.ua/www && bash server/deploy.sh
#
# Что защищено от перезаписи:
#   uploads/     — не в Git (.gitignore), git pull не трогает
#   server/.env  — не в Git (.gitignore), git pull не трогает

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT" || exit 1

# Генерируем timestamp для отслеживания деплоя
DEPLOY_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')
DEPLOY_TIMESTAMP_FILE="$PROJECT_ROOT/DEPLOY_TIMESTAMP.txt"

echo "=== DEPLOYMENT STARTED ==="
echo "Project root: $PROJECT_ROOT"
echo "Current branch: $(git branch --show-current)"
echo "Current commit: $(git log --oneline -1)"

# 1. Получаем свежий код из Git
echo ""
echo "Pulling latest code..."
git pull origin main

if [ $? -ne 0 ]; then
  echo "ERROR: git pull failed! Aborting deploy."
  exit 1
fi

echo "New commit: $(git log --oneline -1)"

# 2. Сборка фронтенда
echo ""
echo "Building frontend..."
# Vite читает index.src.html как точку входа (настроено в vite.config.ts).
# index.html в корне — скомпилированная версия для Apache, не участвует в сборке.
npm run build

# 2. КРИТИЧНО: Копирование файлов из dist/ в корень
echo "Copying files from dist/ to root..."

# Создаем папку assets если её нет
mkdir -p assets

# Очищаем старые файлы из assets перед копированием новых
echo "Cleaning old assets..."
rm -f assets/index-*.js assets/index-*.css 2>/dev/null || true

# Копируем index.html ПЕРВЫМ (КРИТИЧНО!)
echo "Copying index.html..."
cp -f dist/index.html index.html

# Копируем assets
echo "Copying assets..."
if [ -d "dist/assets" ]; then
  cp -r dist/assets/* assets/ 2>/dev/null || true
else
  echo "ERROR: dist/assets directory not found!"
  exit 1
fi

# Копируем другие файлы из dist (favicon, robots.txt и т.д.)
if [ -f "dist/favicon.ico" ]; then
  cp -f dist/favicon.ico favicon.ico 2>/dev/null || true
fi
if [ -f "dist/robots.txt" ]; then
  cp -f dist/robots.txt robots.txt 2>/dev/null || true
fi

# Копируем папку animations (для Lottie анимаций)
if [ -d "dist/animations" ]; then
  echo "Copying animations..."
  mkdir -p animations
  cp -r dist/animations/* animations/ 2>/dev/null || true
  chmod 755 animations 2>/dev/null || true
  chmod 644 animations/* 2>/dev/null || true
fi

# КРИТИЧНО: Копируем .htaccess для правильных MIME типов
if [ -f "public/.htaccess" ]; then
  cp -f public/.htaccess .htaccess 2>/dev/null || true
  echo "Copied .htaccess for MIME types"
fi

# 3. Установка прав доступа
echo "Setting permissions..."
chmod 755 assets
chmod 644 assets/* 2>/dev/null || true
chmod 644 index.html

# 4. КРИТИЧНО: Проверка, что файлы скопированы правильно
echo "Verifying deployment..."
if grep -q "main.tsx" index.html; then
  echo "ERROR: index.html still references main.tsx! Deployment failed!"
  exit 1
fi

if ! grep -q "index-.*\.js" index.html; then
  echo "ERROR: index.html doesn't reference compiled JS file! Deployment failed!"
  exit 1
fi

if [ ! -d "assets" ] || [ -z "$(ls -A assets 2>/dev/null)" ]; then
  echo "ERROR: assets directory is empty! Deployment failed!"
  exit 1
fi

echo "✓ Deployment verification passed"

# 5. Сохраняем timestamp деплоя
echo "Saving deployment timestamp..."
echo "$DEPLOY_TIMESTAMP" > "$DEPLOY_TIMESTAMP_FILE"
chmod 644 "$DEPLOY_TIMESTAMP_FILE"
echo "✓ Deployment timestamp saved: $DEPLOY_TIMESTAMP"

# 6. Перезапуск сервера
echo "Restarting server..."
# Останавливаем все процессы node, связанные с server/index.js
pkill -f "node.*server/index.js" || true
sleep 2
# Запускаем с ограничением памяти (512MB) для предотвращения OOM killer
# Важно: запускаем из корня проекта
nohup node --max-old-space-size=512 server/index.js > server/api.log 2>&1 &
sleep 1

# 7. Проверка, что файлы действительно обновились на сайте
echo "Verifying files on website..."
sleep 2
VERIFY_URL="https://fetr.in.ua/DEPLOY_TIMESTAMP.txt"
REMOTE_TIMESTAMP=$(curl -s "$VERIFY_URL" 2>/dev/null | head -1 | tr -d '\r\n' || echo "")

if [ -n "$REMOTE_TIMESTAMP" ] && [ "$REMOTE_TIMESTAMP" = "$DEPLOY_TIMESTAMP" ]; then
  echo "✓ Files verified on website - timestamp matches"
else
  echo "⚠ WARNING: Timestamp mismatch or file not accessible"
  echo "  Expected: $DEPLOY_TIMESTAMP"
  echo "  Got from website: $REMOTE_TIMESTAMP"
  echo "  Retrying file copy..."
  
  # Повторная попытка копирования
  cp -f dist/index.html index.html
  cp -r dist/assets/* assets/ 2>/dev/null || true
  echo "$DEPLOY_TIMESTAMP" > "$DEPLOY_TIMESTAMP_FILE"
  chmod 644 "$DEPLOY_TIMESTAMP_FILE"
  chmod 755 assets
  chmod 644 assets/* 2>/dev/null || true
  chmod 644 index.html
  
  sleep 2
  REMOTE_TIMESTAMP_RETRY=$(curl -s "$VERIFY_URL" 2>/dev/null | head -1 | tr -d '\r\n' || echo "")
  if [ -n "$REMOTE_TIMESTAMP_RETRY" ] && [ "$REMOTE_TIMESTAMP_RETRY" = "$DEPLOY_TIMESTAMP" ]; then
    echo "✓ Files verified after retry - timestamp matches"
  else
    echo "⚠ WARNING: Timestamp still doesn't match after retry"
    echo "  This might be a caching issue. Please check manually."
  fi
fi

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "🕐 DEPLOY TIMESTAMP: $DEPLOY_TIMESTAMP"
echo ""
echo "✅ All files automatically copied:"
echo "  - dist/index.html -> index.html"
echo "  - dist/assets/* -> assets/"
echo "  - public/.htaccess -> .htaccess (for MIME types)"
echo "  - DEPLOY_TIMESTAMP.txt -> DEPLOY_TIMESTAMP.txt"
echo ""
echo "✅ Permissions set:"
echo "  - assets/ (755)"
echo "  - assets/* (644)"
echo "  - index.html (644)"
echo "  - DEPLOY_TIMESTAMP.txt (644)"
echo ""
echo "✅ Server restarted"
echo ""
echo "🎯 Все выполнено автоматически одним скриптом!"
