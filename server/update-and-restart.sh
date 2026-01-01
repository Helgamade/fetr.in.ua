#!/bin/bash
# Скрипт для обновления кода и перезапуска сервера
# Использование: cd /home/idesig02/fetr.in.ua/www && bash server/update-and-restart.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT" || exit 1

echo "=== UPDATING CODE ==="
echo "Current directory: $(pwd)"
echo "Current branch: $(git branch --show-current)"
echo "Current commit: $(git log --oneline -1)"

# Обновляем код из репозитория
echo ""
echo "Pulling latest code from origin/main..."
git pull origin main

if [ $? -ne 0 ]; then
  echo "ERROR: git pull failed!"
  exit 1
fi

echo ""
echo "New commit: $(git log --oneline -1)"

# Проверяем, что файл wayforpay.js обновился
echo ""
echo "=== CHECKING WAYFORPAY FILE ==="
if grep -q "Callback received" server/routes/wayforpay.js; then
  echo "ERROR: Old code still present in server/routes/wayforpay.js!"
  echo "File contains 'Callback received' - this should not be there!"
  exit 1
else
  echo "✓ File server/routes/wayforpay.js is updated (no 'Callback received' found)"
fi

# Проверяем, что есть новые логи
if grep -q "===== CALLBACK START =====" server/routes/wayforpay.js; then
  echo "✓ New callback handler code found"
else
  echo "WARNING: New callback handler code not found!"
fi

# Останавливаем старый процесс
echo ""
echo "=== STOPPING OLD SERVER PROCESS ==="
pkill -f "node.*index.js" || echo "No process found (already stopped?)"
sleep 2

# Проверяем, что процесс остановился
if pgrep -f "node.*index.js" > /dev/null; then
  echo "WARNING: Process still running, trying force kill..."
  pkill -9 -f "node.*index.js"
  sleep 1
fi

# Проверяем еще раз
if pgrep -f "node.*index.js" > /dev/null; then
  echo "ERROR: Could not stop server process!"
  echo "Please stop it manually: pkill -9 -f 'node.*index.js'"
  exit 1
else
  echo "✓ Server process stopped"
fi

# Запускаем сервер заново
echo ""
echo "=== STARTING SERVER ==="
cd "$PROJECT_ROOT"
nohup node server/index.js > /dev/null 2>&1 &
NEW_PID=$!

sleep 2

# Проверяем, что процесс запустился
if ps -p $NEW_PID > /dev/null; then
  echo "✓ Server started with PID: $NEW_PID"
else
  echo "ERROR: Server did not start!"
  echo "Check logs: tail -f /home/idesig02/.system/webapp/www.fetr.in.ua.log"
  exit 1
fi

echo ""
echo "=== UPDATE COMPLETE ==="
echo "Server restarted successfully!"
echo "Check logs: tail -f /home/idesig02/.system/webapp/www.fetr.in.ua.log"
echo ""
echo "Next callback should show:"
echo "  [WayForPay] ===== CALLBACK START ====="
echo "  [WayForPay] First key: ..."
echo "  [WayForPay] Successfully parsed JSON from key!"

