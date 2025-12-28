#!/bin/bash
# Скрипт для остановки API сервера

PID=$(pgrep -f "node.*server/index.js")

if [ -z "$PID" ]; then
    echo "⚠️  Server is not running"
    exit 1
fi

kill $PID
echo "✅ Server stopped (PID: $PID)"


