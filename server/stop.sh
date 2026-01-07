#!/bin/bash
# Скрипт для остановки API сервера

# Используем ps для более точной проверки (исключаем grep через [n]ode)
PIDS=$(ps aux | grep "[n]ode.*server/index.js" | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "⚠️  Server is not running"
    exit 1
fi

echo "Found processes: $PIDS"

# Останавливаем все найденные процессы
for PID in $PIDS; do
    echo "Stopping process $PID..."
    kill $PID 2>/dev/null || true
done

# Также останавливаем родительские bash процессы, которые могут запускать node
PARENT_PIDS=$(ps aux | grep "[b]ash.*node server/index.js" | awk '{print $2}')
if [ ! -z "$PARENT_PIDS" ]; then
    echo "Stopping parent processes: $PARENT_PIDS"
    for PID in $PARENT_PIDS; do
        kill $PID 2>/dev/null || true
    done
fi

# Ждем завершения процессов
sleep 3

# Если процессы еще живы, принудительно убиваем
REMAINING=$(ps aux | grep "[n]ode.*server/index.js" | awk '{print $2}')
if [ ! -z "$REMAINING" ]; then
    echo "Force killing remaining processes: $REMAINING"
    for PID in $REMAINING; do
        kill -9 $PID 2>/dev/null || true
    done
    sleep 1
fi

# Проверяем, что все остановлено
FINAL_CHECK=$(ps aux | grep "[n]ode.*server/index.js" | awk '{print $2}')
if [ -z "$FINAL_CHECK" ]; then
    echo "✅ Server stopped"
else
    echo "⚠️  Some processes may still be running: $FINAL_CHECK"
    echo "   Try: kill -9 $FINAL_CHECK"
fi


