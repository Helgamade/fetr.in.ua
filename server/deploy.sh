#!/bin/bash
# Скрипт для деплоя фронтенда после обновления кода
# Использование: cd /home/idesig02/fetr.in.ua/www && bash server/deploy.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT" || exit 1

echo "=== DEPLOYMENT STARTED ==="
echo "Project root: $PROJECT_ROOT"

# 1. Сборка фронтенда
echo "Building frontend..."
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

# 5. Перезапуск сервера
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
echo "✓ Server restarted"
