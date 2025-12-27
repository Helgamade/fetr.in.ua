#!/bin/bash
# Скрипт для проверки статуса API сервера

PID=$(pgrep -f "node.*server/index.js")

if [ -z "$PID" ]; then
    echo "❌ Server is NOT running"
    exit 1
fi

echo "✅ Server is running (PID: $PID)"
echo ""
echo "Health check:"
curl -s http://localhost:3001/api/health | head -1
echo ""

