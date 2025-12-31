# Команды для просмотра логов WayForPay

## Основной файл логов
```bash
/home/idesig02/.system/webapp/www.fetr.in.ua.log
```

## Команды для просмотра

### Последние 100 строк с информацией о WayForPay:
```bash
tail -100 /home/idesig02/.system/webapp/www.fetr.in.ua.log | grep -A 15 WayForPay
```

### Последние 50 строк с подписью:
```bash
tail -100 /home/idesig02/.system/webapp/www.fetr.in.ua.log | grep -A 5 'Signature string'
```

### Все логи WayForPay:
```bash
grep WayForPay /home/idesig02/.system/webapp/www.fetr.in.ua.log | tail -50
```

### Логи в реальном времени (следить за новыми сообщениями):
```bash
tail -f /home/idesig02/.system/webapp/www.fetr.in.ua.log | grep --line-buffered WayForPay
```

### Последние 200 строк всех логов:
```bash
tail -200 /home/idesig02/.system/webapp/www.fetr.in.ua.log
```

### Последний созданный платеж (самая свежая информация):
```bash
tail -100 /home/idesig02/.system/webapp/www.fetr.in.ua.log | grep -B 10 -A 20 'Creating payment' | tail -40
```

## Важно
- Не пытайтесь выполнить файл как команду (`/home/idesig02/.system/webapp/www.fetr.in.ua.log`)
- Используйте команды для чтения: `cat`, `tail`, `grep`, `less`, `more`
- Для просмотра логов в реальном времени используйте `tail -f`

