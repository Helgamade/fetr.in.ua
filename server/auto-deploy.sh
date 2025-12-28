#!/bin/bash
# Автоматический скрипт деплоя, который ВСЕГДА копирует файлы из dist/
# Этот скрипт должен выполняться после КАЖДОГО git pull/reset

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT" || exit 1

echo "=== AUTO-DEPLOY: Copying frontend files ==="

# КРИТИЧНО: ВСЕГДА копируем файлы из dist/ в корень
if [ ! -d "dist" ]; then
  echo "WARNING: dist/ directory not found, building..."
  npm run build
fi

# Создаем папку assets если её нет
mkdir -p assets

# Копируем index.html ПЕРВЫМ (КРИТИЧНО!)
echo "Copying index.html..."
cp -f dist/index.html index.html

# Копируем assets
echo "Copying assets..."
if [ -d "dist/assets" ]; then
  rm -f assets/index-*.js assets/index-*.css 2>/dev/null || true
  cp -r dist/assets/* assets/ 2>/dev/null || true
else
  echo "WARNING: dist/assets directory not found!"
fi

# Копируем другие файлы из dist
if [ -f "dist/favicon.ico" ]; then
  cp -f dist/favicon.ico favicon.ico 2>/dev/null || true
fi
if [ -f "dist/robots.txt" ]; then
  cp -f dist/robots.txt robots.txt 2>/dev/null || true
fi

# Устанавливаем права доступа
chmod 755 assets
chmod 644 assets/* 2>/dev/null || true
chmod 644 index.html

# Проверяем, что index.html правильный
if grep -q "main.tsx" index.html; then
  echo "ERROR: index.html still references main.tsx! Copy from dist/ failed!"
  exit 1
fi

if ! grep -q "index-.*\.js" index.html; then
  echo "ERROR: index.html doesn't reference compiled JS file!"
  exit 1
fi

echo "=== Files copied successfully ==="


