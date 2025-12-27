# API Server Management

## Запуск сервера

```bash
cd /home/idesig02/fetr.in.ua/www
./server/start.sh
```

Или вручную:
```bash
cd /home/idesig02/fetr.in.ua/www
nohup node server/index.js > server/api.log 2>&1 &
```

## Остановка сервера

```bash
./server/stop.sh
```

Или вручную:
```bash
pkill -f "node.*server/index.js"
```

## Проверка статуса

```bash
./server/status.sh
```

Или вручную:
```bash
ps aux | grep "node.*server/index.js"
curl http://localhost:3001/api/health
```

## Просмотр логов

```bash
tail -f server/api.log
```

## Если процесс убивается (Killed)

Возможные причины:
1. **Недостаточно памяти** - проверьте `free -h`
2. **Ограничения хостинга** - свяжитесь с поддержкой
3. **Проблемы с правами** - проверьте права на файлы

Альтернативные решения:
- Использовать systemd (если доступен root)
- Запускать через cron с проверкой
- Использовать внешний процесс-менеджер

## Автозапуск при перезагрузке

Добавьте в crontab:
```bash
crontab -e
# Добавьте строку:
@reboot cd /home/idesig02/fetr.in.ua/www && nohup node server/index.js > server/api.log 2>&1 &
```

## Проверка порта

```bash
netstat -tlnp | grep 3001
# или
lsof -i :3001
```

