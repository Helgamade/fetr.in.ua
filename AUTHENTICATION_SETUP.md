# Налаштування автентифікації та безпеки

## 👀 Реалізовано

✅ Повна система авторизації через Google OAuth  
✅ JWT токени (access + refresh)  
✅ Захист від брутфорсу та DDoS  
✅ Захист адмін панелі на всіх рівнях  
✅ Інтеграція з системою заказів  
✅ Профіль користувача та особистий кабінет  
✅ Система доступу до закритих матеріалів

---

## 🔐 Архітектура безпеки

### 1. Багаторівневий захист

#### Backend
- **JWT токени**: Access token (15 хв) + Refresh token (7 днів)
- **Rate limiting**: Обмеження запитів з одного IP
- **IP блокування**: Автоматична блокування підозрілих IP
- **Логування**: Всі дії адміністраторів записуються в БД
- **CSRF захист**: Токени для всіх змінюючих запитів
- **Helmet.js**: Захист від XSS та інших атак

#### Frontend
- **ProtectedRoute**: Компонент для захисту роутів
- **AuthContext**: Централізоване управління авторизацією
- **Автооновлення токенів**: Кожні 10 хвилин
- **Перевірка ролей**: Окрема перевірка для admin/user

### 2. Захист від атак

| Тип атаки | Захист |
|-----------|--------|
| Брутфорс | Макс 5 спроб/хв, блокування на 1 годину |
| DDoS | Rate limiting: 300 запитів/15 хв |
| SQL Injection | Prepared statements (MySQL2) |
| XSS | React автоекранування + Helmet |
| CSRF | SameSite cookies + Origin header |
| Session hijacking | Перевірка IP та User-Agent |

---

## 📦 Встановлення пакетів

```bash
npm install
```

Додані пакети:
- `passport` - OAuth фреймворк
- `passport-google-oauth20` - Google OAuth стратегія
- `jsonwebtoken` - JWT токени
- `bcrypt` - Хешування паролів
- `express-rate-limit` - Rate limiting
- `helmet` - HTTP security headers
- `cookie-parser` - Cookie обробка
- `crypto` - Генерація токенів

---

## ⚙️ Налаштування Google OAuth

### 1. Створіть проект в Google Cloud Console

1. Перейдіть на https://console.cloud.google.com/
2. Створіть новий проект або виберіть існуючий
3. Перейдіть в **APIs & Services** → **Credentials**
4. Натисніть **Create Credentials** → **OAuth client ID**
5. Виберіть тип **Web application**

### 2. Налаштуйте Authorized redirect URIs

Для development:
```
http://localhost:8080/api/auth/google/callback
```

Для production:
```
https://fetr.in.ua/api/auth/google/callback
```

### 3. Отримайте Client ID та Client Secret

Після створення ви отримаєте:
- **Client ID**: `xxxxx.apps.googleusercontent.com`
- **Client Secret**: `xxxxx`

### 4. Додайте в .env файл

```env
GOOGLE_CLIENT_ID=ваш_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ваш_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
```

Для production змініть `GOOGLE_CALLBACK_URL` на:
```env
GOOGLE_CALLBACK_URL=https://fetr.in.ua/api/auth/google/callback
```

### 5. Генерація JWT секретів

```bash
# Для JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Для JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Додайте їх в `.env`:
```env
JWT_SECRET=ваш_згенерований_секрет
JWT_REFRESH_SECRET=ваш_згенерований_refresh_секрет
```

---

## 🗄️ Міграція бази даних

```bash
# Застосуйте міграцію
mysql -u root -p fetr_db < database/migrations/009_add_authentication.sql
```

Міграція створює:
- ✅ Таблиця `user_sessions` - сесії користувачів
- ✅ Таблиця `user_access` - доступ до матеріалів
- ✅ Таблиця `login_attempts` - попитки входу
- ✅ Таблиця `blocked_ips` - заблоковані IP
- ✅ Таблиця `admin_logs` - логи дій адміністраторів
- ✅ Додані поля в `users`: `google_id`, `avatar_url`, `last_login`
- ✅ Додане поле в `orders`: `user_id`

---

## 🚀 Запуск

### Development
```bash
npm run dev
npm run server:dev
```

### Production
```bash
npm run build
npm run server
```

---

## 🔒 Створення першого адміністратора

### Через Google OAuth

1. Зареєструйтеся через Google
2. Знайдіть свій `id` в таблиці `users`
3. Оновіть роль на `admin`:

```sql
UPDATE users SET role = 'admin' WHERE email = 'ваш@email.com';
```

### Через SQL (з паролем)

```sql
-- Згенеруйте bcrypt hash для пароля (приклад для Node.js):
-- bcrypt.hashSync('your_password', 10)

INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
VALUES ('Admin', 'admin@fetr.in.ua', '$2b$10$...', 'admin', TRUE, TRUE);
```

---

## 📋 API Endpoints

### Публічні

- `GET /api/auth/google` - Початок OAuth процесу
- `GET /api/auth/google/callback` - Callback від Google
- `POST /api/auth/refresh` - Оновлення токену
- `POST /api/auth/logout` - Вихід

### Захищені (потрібен токен)

- `GET /api/auth/me` - Поточний користувач
- `GET /api/auth/sessions` - Список сесій
- `DELETE /api/auth/sessions/:id` - Видалення сесії
- `POST /api/auth/link-orders` - Прив'язка заказів

### Адмін (потрібна роль admin)

- `POST /api/admin-auth/login` - Вхід email/password
- `GET /api/admin-auth/verify` - Перевірка прав
- `GET /api/admin-auth/logs` - Логи дій адмінів
- `GET /api/admin-auth/login-attempts` - Попитки входу
- `GET /api/admin-auth/blocked-ips` - Заблоковані IP
- `DELETE /api/admin-auth/blocked-ips/:ip` - Розблокування

---

## 🛡️ Рекомендації по безпеці

### 1. Використовуйте HTTPS в production
```nginx
# Приклад Nginx конфігурації
server {
    listen 443 ssl http2;
    server_name fetr.in.ua;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Налаштуйте IP whitelist для адмін панелі (опціонально)

В налаштуваннях сайту додайте:
```json
{
  "admin_ip_whitelist": ["1.2.3.4", "5.6.7.8"]
}
```

### 3. Регулярно оновлюйте залежності
```bash
npm audit
npm update
```

### 4. Моніторинг підозрілої активності

Перевіряйте таблиці:
```sql
-- Останні спроби входу
SELECT * FROM login_attempts ORDER BY created_at DESC LIMIT 100;

-- Заблоковані IP
SELECT * FROM blocked_ips WHERE blocked_until > NOW();

-- Дії адміністраторів
SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 100;
```

### 5. Резервне копіювання

```bash
# Щоденне резервне копіювання
mysqldump -u root -p fetr_db > backup_$(date +%Y%m%d).sql
```

---

## 🎯 Використання на Frontend

### AuthContext

```tsx
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return <div>Hello, {user.name}!</div>;
}
```

### Google Login Button

```tsx
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

<GoogleLoginButton />
```

### Protected Route

```tsx
<Route path="/admin" element={
  <ProtectedRoute requireAdmin>
    <AdminPanel />
  </ProtectedRoute>
} />
```

---

## 🐛 Troubleshooting

### 1. Помилка "Redirect URI mismatch"

Переконайтеся, що URL в Google Console збігається з `GOOGLE_CALLBACK_URL` в `.env`.

### 2. Токен просрочений

Токени автоматично оновлюються. Якщо це не працює, перевірте:
- Наявність refresh token в localStorage
- Роботу endpoint `/api/auth/refresh`

### 3. IP блокування не працює

Перевірте, що `x-forwarded-for` header правильно налаштований на nginx/proxy.

### 4. Адмін не може увійти

Перевірте:
```sql
SELECT * FROM users WHERE email = 'ваш@email.com';
-- role повинна бути 'admin'
-- is_active повинна бути TRUE
```

---

## 📞 Підтримка

Якщо виникли питання або проблеми:
- Перевірте логи: `console.log` в браузері та `console.error` на сервері
- Перегляньте таблицю `admin_logs` для відстеження дій
- Перевірте налаштування в `.env`

---

**Система повністю готова до production використання!** 🚀

