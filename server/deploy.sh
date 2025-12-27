#!/bin/bash
# Скрипт для деплоя фронтенда после обновления кода
# Использование: cd /home/idesig02/fetr.in.ua/www && bash server/deploy.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT" || exit 1

echo "=== DEPLOYMENT STARTED ==="
echo "Project root: $PROJECT_ROOT"

# 1. Сборка фронтенда (если есть изменения)
echo "Building frontend..."
npm run build

# 2. КРИТИЧНО: Копирование файлов из dist/ в корень
echo "Copying files from dist/ to root..."

# Создаем папку assets если её нет
mkdir -p assets

# Копируем index.html ПЕРВЫМ (КРИТИЧНО!)
echo "Copying index.html..."
cp dist/index.html index.html

# Копируем assets
echo "Copying assets..."
if [ -d "dist/assets" ]; then
  cp -r dist/assets/* assets/ 2>/dev/null || true
else
  echo "WARNING: dist/assets directory not found!"
fi

# Копируем другие файлы из dist (favicon, robots.txt и т.д.)
if [ -f "dist/favicon.ico" ]; then
  cp dist/favicon.ico favicon.ico 2>/dev/null || true
fi
if [ -f "dist/robots.txt" ]; then
  cp dist/robots.txt robots.txt 2>/dev/null || true
fi

# 3. Установка прав доступа
echo "Setting permissions..."
chmod 755 assets
chmod 644 assets/* 2>/dev/null || true
chmod 644 index.html

# 4. Перезапуск сервера
echo "Restarting server..."
cd server
pkill -f "node.*index.js" || true
sleep 1
nohup node index.js > /dev/null 2>&1 &
cd ..

echo "=== DEPLOYMENT COMPLETE ==="
echo "Files copied:"
echo "  - dist/index.html -> index.html"
echo "  - dist/assets/* -> assets/"
