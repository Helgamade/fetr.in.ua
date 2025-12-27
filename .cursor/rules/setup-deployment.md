# Настройка автоматического деплоя на сервер

## 🚀 Быстрая настройка

### Шаг 1: Настройка на сервере

Выполните на сервере (через SSH):

```bash
# Подключиться к серверу
ssh idesig02@idesig02.ftp.tools

# Перейти в директорию проекта (или создать её)
cd /home/idesig02/
mkdir -p fetr.in.ua
cd fetr.in.ua

# Если проект еще не клонирован, клонировать его
if [ ! -d ".git" ]; then
    git clone https://github.com/Helgamade/fetr.in.ua.git .
fi

# Загрузить скрипт настройки на сервер
# (скопируйте содержимое scripts/setup-deploy.sh и выполните на сервере)
# Или используйте готовый скрипт:
```

**Альтернативный способ - использовать готовый скрипт:**

```bash
# С локальной машины загрузить скрипт на сервер
scp scripts/setup-deploy.sh idesig02@idesig02.ftp.tools:/tmp/

# На сервере выполнить
ssh idesig02@idesig02.ftp.tools "bash /tmp/setup-deploy.sh"
```

### Шаг 2: Настройка на локальной машине

Добавьте production remote:

```bash
git remote add production idesig02@idesig02.ftp.tools:deploy.git
```

Проверьте настройку:

```bash
git remote -v
```

Должно показать:
```
origin      https://github.com/Helgamade/fetr.in.ua.git (fetch)
origin      https://github.com/Helgamade/fetr.in.ua.git (push)
production  idesig02@idesig02.ftp.tools:deploy.git (fetch)
production  idesig02@idesig02.ftp.tools:deploy.git (push)
```

---

## 📋 Процесс деплоя

### После изменений в коде:

```bash
# 1. Собрать проект (если изменился фронтенд)
npm run build

# 2. Закоммитить изменения (включая dist/ если изменился фронтенд)
git add .
git commit -m "Описание изменений"

# 3. Загрузить в GitHub
git push origin main

# 4. Задеплоить на production сервер (автоматически!)
git push production main
```

**Что происходит автоматически:**
1. Код обновляется на сервере из GitHub
2. Копируется `dist/index.html` → `www/index.html` (КРИТИЧНО!)
3. Копируются `dist/assets/*` → `www/assets/`
4. Устанавливаются права доступа
5. Сайт обновлен!

**⚠️ ВАЖНО: Файлы сохраняются ТОЛЬКО в `/home/idesig02/fetr.in.ua/www/`, в корень НИЧЕГО не копируется!**

---

## 🔧 Ручная настройка (если скрипт не работает)

### На сервере:

```bash
# 1. Создать bare репозиторий
git init --bare ~/deploy.git

# 2. Создать post-receive hook
cat > ~/deploy.git/hooks/post-receive << 'EOF'
#!/bin/bash
unset GIT_DIR
cd /home/idesig02/fetr.in.ua
git fetch origin
git reset --hard origin/main
mkdir -p www/assets
cp dist/index.html www/index.html
cp -r dist/assets/* www/assets/ 2>/dev/null || true
chmod 755 www/assets
chmod 644 www/assets/*
chmod 644 www/index.html
EOF

# 3. Установить права на выполнение
chmod +x ~/deploy.git/hooks/post-receive

# 4. Конвертировать в Unix формат (LF)
sed -i 's/\r$//' ~/deploy.git/hooks/post-receive
```

---

## ✅ Проверка настройки

### Проверка hook на сервере:

```bash
ssh idesig02@idesig02.ftp.tools "ls -la ~/deploy.git/hooks/post-receive"
# Должно показать: -rwxr-xr-x

ssh idesig02@idesig02.ftp.tools "file ~/deploy.git/hooks/post-receive"
# Должно показать: ... ASCII text (не CRLF!)

ssh idesig02@idesig02.ftp.tools "bash -n ~/deploy.git/hooks/post-receive"
# Не должно быть ошибок синтаксиса
```

### Тестовый деплой:

```bash
# Сделать небольшое изменение
echo "# Test" >> README.md
git add README.md
git commit -m "Test deployment"
git push origin main
git push production main

# Проверить что изменения появились на сервере
ssh idesig02@idesig02.ftp.tools "cd /home/idesig02/fetr.in.ua && tail -3 README.md"
```

---

## 🐛 Устранение проблем

### Проблема: "Permission denied (publickey)"

**Решение:** Настроить SSH ключ:
```bash
# Проверить наличие ключа
ls -la ~/.ssh/id_rsa.pub

# Если ключа нет, создать:
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Скопировать ключ на сервер
ssh-copy-id idesig02@idesig02.ftp.tools
```

### Проблема: Hook не выполняется

**Проверка:**
```bash
# Проверить формат файла (должен быть LF, не CRLF)
ssh idesig02@idesig02.ftp.tools "file ~/deploy.git/hooks/post-receive"

# Если CRLF, конвертировать:
ssh idesig02@idesig02.ftp.tools "sed -i 's/\r$//' ~/deploy.git/hooks/post-receive"

# Проверить синтаксис:
ssh idesig02@idesig02.ftp.tools "bash -n ~/deploy.git/hooks/post-receive"
```

### Проблема: "fatal: not a git repository"

**Решение:** Убедиться что hook содержит `unset GIT_DIR` перед git командами!

---

## 📝 Важные заметки

1. **КРИТИЧНО:** Hook ДОЛЖЕН содержать `unset GIT_DIR` перед git командами
2. **КРИТИЧНО:** Hook должен быть в Unix формате (LF), не Windows (CRLF)
3. **КРИТИЧНО:** Hook должен быть исполняемым (`chmod +x`)
4. После каждого деплоя проверять что `www/index.html` ссылается на `/assets/index-*.js`
5. **КРИТИЧНО:** Файлы сохраняются ТОЛЬКО в `/home/idesig02/fetr.in.ua/www/`, в корень НИЧЕГО не копируется!

---

**Последнее обновление:** 2025-01-XX


