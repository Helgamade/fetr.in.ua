#!/bin/bash
# Скрипт для запуска API сервера в фоне

cd "$(dirname "$0")/.."
cd server

# Проверяем, не запущен ли уже сервер
if pgrep -f "node.*server/index.js" > /dev/null; then
    echo "⚠️  Server is already running!"
    exit 1
fi

# Запускаем сервер в фоне
nohup node index.js > api.log 2>&1 &
PID=$!

echo "✅ Server started with PID: $PID"
echo "📝 Logs: server/api.log"
echo ""
echo "To stop server: kill $PID"
echo "To check status: ps aux | grep 'node.*server/index.js'"
echo "To view logs: tail -f server/api.log"

