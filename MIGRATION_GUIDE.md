# Руководство по миграции на базу данных

## Что было сделано

1. ✅ Создана структура базы данных MySQL (15 таблиц)
2. ✅ Создан backend API сервер на Express
3. ✅ Созданы API endpoints для всех сущностей
4. ✅ Создан API клиент для frontend
5. ✅ Созданы React Query hooks для работы с API
6. ✅ База данных заполнена тестовыми данными из mock файлов

## Структура проекта

```
project/
├── database/
│   ├── schema.sql      # SQL скрипт создания таблиц
│   └── seed.sql        # SQL скрипт заполнения тестовыми данными
├── server/
│   ├── index.js        # Express сервер
│   ├── db.js           # Подключение к MySQL
│   ├── routes/         # API routes
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── settings.js
│   │   ├── users.js
│   │   ├── pages.js
│   │   ├── faqs.js
│   │   ├── reviews.js
│   │   ├── team.js
│   │   └── gallery.js
│   └── .env.example    # Пример конфигурации
├── src/
│   ├── lib/
│   │   └── api.ts      # API клиент
│   └── hooks/
│       ├── useProducts.ts
│       ├── useOrders.ts
│       └── useSettings.ts
└── README_DATABASE.md   # Инструкции по настройке БД
```

## Шаги для запуска

### 1. Настройка базы данных

```bash
# Подключитесь к MySQL и создайте БД
mysql -u idesig02 -p

# Выполните SQL скрипты
mysql -u idesig02 -p idesig02_fetrinua < database/schema.sql
mysql -u idesig02 -p idesig02_fetrinua < database/seed.sql
```

### 2. Настройка backend

Создайте файл `server/.env`:
```env
DB_HOST=idesig02.mysql.tools
DB_USER=idesig02_fetrinua
DB_PASSWORD=7%j-7EyzF8
DB_NAME=idesig02_fetrinua
DB_PORT=3306
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://fetr.in.ua
```

**Примечание:** Хостинг автоматически устанавливает `PORT=3000` и `HOST=127.1.5.169` через переменные окружения, переопределяя значения из `.env`.

Запустите сервер:
```bash
npm run server
```

### 3. Настройка frontend

**Примечание:** В коде `src/lib/api.ts` используется захардкоженное значение `API_BASE_URL = '/api'`. Дополнительная настройка не требуется.

## Миграция компонентов

### Пример: Обновление компонента Products

**Было (использование mock данных):**
```typescript
import { products as initialProducts } from '@/data/products';

export function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  // ...
}
```

**Стало (использование API):**
```typescript
import { useProducts, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';

export function Products() {
  const { data: products = [], isLoading } = useProducts();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  if (isLoading) return <div>Loading...</div>;
  // ...
}
```

### Пример: Обновление компонента Orders

**Было:**
```typescript
import { mockOrders } from '@/data/mockOrders';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  // ...
}
```

**Стало:**
```typescript
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';

export function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatus.mutate({ id: orderId, status: newStatus });
  };
  // ...
}
```

## Компоненты для обновления

1. ✅ `src/hooks/useProducts.ts` - готово
2. ✅ `src/hooks/useOrders.ts` - готово
3. ✅ `src/hooks/useSettings.ts` - готово
4. ⏳ `src/pages/admin/Products.tsx` - нужно обновить
5. ⏳ `src/pages/admin/Orders.tsx` - нужно обновить
6. ⏳ `src/pages/admin/Dashboard.tsx` - нужно обновить
7. ⏳ `src/pages/admin/Settings.tsx` - нужно обновить
8. ⏳ `src/pages/Index.tsx` - нужно обновить (products, faqs, reviews, team, gallery)
9. ⏳ `src/pages/Checkout.tsx` - нужно обновить (создание заказа)

## Переключение между mock и API

Для постепенной миграции можно использовать флаг:

```typescript
const USE_API = import.meta.env.VITE_USE_API === 'true';

export function Products() {
  const { data: apiProducts = [], isLoading } = useProducts();
  const mockProducts = initialProducts;
  
  const products = USE_API ? apiProducts : mockProducts;
  
  if (USE_API && isLoading) return <div>Loading...</div>;
  // ...
}
```

## Проверка работы

1. Запустите backend: `./server/start.sh`
2. Проверьте health check:
   - Внутренний доступ: `curl http://127.1.5.169:3000/api/health`
   - Через прокси: `curl https://fetr.in.ua/api/health`
3. Проверьте получение товаров: `curl https://fetr.in.ua/api/products`
4. Откройте сайт в браузере и проверьте работу админ-панели

## Следующие шаги

1. Обновить все компоненты для использования API
2. Добавить обработку ошибок
3. Добавить loading states
4. Добавить оптимистичные обновления
5. Настроить production окружение

