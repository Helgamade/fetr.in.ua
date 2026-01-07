#!/bin/bash
# Скрипт для проверки статуса API сервера

# Используем ps для более точной проверки (исключаем grep через [n]ode)
PID=$(ps aux | grep "[n]ode.*server/index.js" | awk '{print $2}' | head -1)

if [ -z "$PID" ]; then
    echo "❌ Server is NOT running"
    exit 1
fi

echo "✅ Server is running (PID: $PID)"
echo ""

# Определяем порт из переменной окружения или используем дефолтный
PORT=${PORT:-3001}
HOST=${HOST:-127.0.0.1}

# Если HOST содержит IP адрес, извлекаем только IP
if [[ "$HOST" == *":"* ]]; then
    HOST=$(echo "$HOST" | cut -d: -f1)
fi

echo "Health check:"
curl -s http://${HOST}:${PORT}/api/health | head -1
echo ""

