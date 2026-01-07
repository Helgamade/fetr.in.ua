# API Server Management

## Запуск сервера

**⚠️ ВАЖНО: Если скрипты не запускаются (Permission denied), установите права:**
```bash
chmod +x server/*.sh
```

**Если сервер уже запущен через админ панель, сначала остановите его:**
```bash
# Остановить процесс
pkill -f "node.*server/index.js"

# Или по PID (из вывода ps aux)
kill 3930503
```

**Затем запустите через SSH:**
```bash
cd /home/idesig02/fetr.in.ua/www
./server/start.sh
```

**Или вручную:**
```bash
cd /home/idesig02/fetr.in.ua/www
nohup node --max-old-space-size=512 server/index.js > server/api.log 2>&1 &
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
curl http://127.1.5.169:3000/api/health
# Или через прокси:
curl https://fetr.in.ua/api/health
```

## Просмотр логов

```bash
tail -f server/api.log
```

## Если процесс убивается (Killed)

**✅ РЕШЕНИЕ: Оптимизирована инициализация и добавлено ограничение памяти**

**Что было сделано:**
1. **Ограничение памяти Node.js**: `--max-old-space-size=512` во всех скриптах
2. **Оптимизация MySQL pool**: 
   - `connectionLimit` уменьшен с 10 до 5
   - `queueLimit` установлен в 50 (было 0 = неограничено)
3. **Отложенная инициализация фоновых задач**:
   - Cleanup интервалы запускаются только после успешного старта сервера
   - Это экономит память при инициализации
4. **Оптимизация cleanup**:
   - Sanitize cleanup запускается каждые 5 минут (было каждую минуту)

**Возможные причины:**
1. **Недостаточно памяти** - проверьте `free -h`
2. **Ограничения хостинга** - свяжитесь с поддержкой
3. **Проблемы с правами** - проверьте права на файлы

**Если проблема сохраняется:**
- Уменьшите лимит до 256MB: замените `512` на `256` в скриптах
- Проверьте использование памяти: `ps aux | grep node`
- Проверьте логи: `tail -f server/api.log`
- Используйте внешний процесс-менеджер (PM2, если доступен)

## Автозапуск при перезагрузке

Добавьте в crontab:
```bash
crontab -e
# Добавьте строку:
@reboot cd /home/idesig02/fetr.in.ua/www && nohup node --max-old-space-size=512 server/index.js > server/api.log 2>&1 &
```

## Проверка порта

```bash
netstat -tlnp | grep 3000
# или
lsof -i :3000
```

