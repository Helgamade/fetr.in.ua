#!/bin/bash
# Скрипт для запуска API сервера в фоне

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
cd server

# Проверяем, не запущен ли уже сервер (по процессу)
# Используем ps для более точной проверки (исключаем grep)
EXISTING_PID=$(ps aux | grep "[n]ode.*server/index.js" | awk '{print $2}' | head -1)

if [ ! -z "$EXISTING_PID" ]; then
    # Дополнительная проверка - убеждаемся, что это действительно node процесс
    if ps -p "$EXISTING_PID" -o comm= 2>/dev/null | grep -q "node"; then
        echo "⚠️  Server is already running (PID: $EXISTING_PID)!"
        echo "   Use './server/stop.sh' to stop it first"
        echo "   Or check: ps aux | grep 'node.*server/index.js' | grep -v grep"
        exit 1
    fi
fi

# Проверяем порты (3001 и 3000 - могут использоваться админ панелью)
PORT_3001=$(lsof -Pi :3001 -sTCP:LISTEN -t 2>/dev/null)
PORT_3000=$(lsof -Pi :3000 -sTCP:LISTEN -t 2>/dev/null)

if [ ! -z "$PORT_3001" ] || [ ! -z "$PORT_3000" ]; then
    echo "⚠️  Port 3000 or 3001 is already in use!"
    if [ ! -z "$PORT_3001" ]; then
        echo "   Port 3001 is used by PID: $PORT_3001"
    fi
    if [ ! -z "$PORT_3000" ]; then
        echo "   Port 3000 is used by PID: $PORT_3000"
    fi
    echo "   This might be the server started from admin panel"
    echo "   Use './server/stop.sh' to stop it first"
    exit 1
fi

# Убеждаемся, что мы в правильной директории
if [ ! -f "index.js" ]; then
    echo "❌ Error: index.js not found in $(pwd)"
    exit 1
fi

# Запускаем сервер в фоне с ограничением памяти (512MB для shared hosting)
# Это предотвращает OOM killer от убийства процесса
# Важно: запускаем из корня проекта, чтобы пути были правильными
cd "$PROJECT_ROOT"
nohup node --max-old-space-size=512 server/index.js > server/api.log 2>&1 &
PID=$!

# Даем серверу время на запуск
sleep 2

# Проверяем, что процесс все еще жив
if ! kill -0 $PID 2>/dev/null; then
    echo "❌ Server failed to start! Check logs:"
    echo ""
    tail -20 server/api.log
    exit 1
fi

echo "✅ Server started with PID: $PID"
echo "📝 Logs: server/api.log"
echo "🌐 Port: $PORT"
echo ""
echo "To stop server: ./server/stop.sh"
echo "To check status: ./server/status.sh"
echo "To view logs: tail -f server/api.log"


