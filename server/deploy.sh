#!/bin/bash
# Скрипт для деплоя фронтенда после обновления кода

#!/bin/bash
# Скрипт для деплоя фронтенда после обновления кода
# Использование: cd /home/idesig02/fetr.in.ua/www && server/deploy.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT" || exit 1

echo "Building frontend..."
npm run build

echo "Copying files..."
# КРИТИЧНО: Копируем index.html ПЕРВЫМ
mkdir -p assets
cp dist/index.html index.html
cp -r dist/assets/* assets/ 2>/dev/null || true

echo "Setting permissions..."
chmod 755 assets
chmod 644 assets/* 2>/dev/null || true
chmod 644 index.html

echo "Restarting server..."
cd server
pkill -f "node.*index.js" || true
sleep 1
nohup node index.js > /dev/null 2>&1 &
cd ..

echo "=== DEPLOYMENT COMPLETE ==="

