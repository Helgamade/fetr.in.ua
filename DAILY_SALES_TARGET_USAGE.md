# Где используется `daily_sales_target`

## 1. **База данных** (`products.daily_sales_target`)
- Поле таблицы `products` - хранит целевое количество продаж в день для каждого товара

## 2. **Серверная часть**

### `server/utils/updatePurchaseCount.js`
- **Функция:** `updatePurchaseCounts()`
- **Использование:** Периодическое обновление `purchase_count` в БД на основе `daily_sales_target` и текущего времени
- **Логика:** 
  - В 00:00 сохраняется базовое значение `purchase_count` в `product_daily_base`
  - Каждый час вычисляется множитель на основе времени суток (0-1)
  - Обновляется: `purchase_count = базовое_значение + (daily_sales_target * multiplier)`
- **Запуск:** Автоматически при старте сервера и каждые 60 минут (через `setInterval` в `server/index.js`)

### `server/routes/products.js`
- **GET `/api/products`** - чтение `daily_sales_target` из БД и преобразование в `dailySalesTarget` для фронтенда
- **GET `/api/products/:id`** - чтение `daily_sales_target` из БД для конкретного товара
- **PUT `/api/products/:id`** - сохранение `dailySalesTarget` в БД при редактировании товара
  - Преобразуется из `dailySalesTarget` (camelCase) в `daily_sales_target` (snake_case) при сохранении

## 3. **Клиентская часть (фронтенд)**

### `src/lib/utils.ts`
- **Функция:** `getTodayPurchases(product: { dailySalesTarget?: number | null })`
- **Использование:** Вычисление количества покупок "сегодня" для модуля Social Proof
- **Логика:** Использует `dailySalesTarget` из объекта товара и текущее время для расчета промежуточного значения (0 до `dailySalesTarget`)
- **НЕ используется для отображения в карточке товара** - там показывается только `purchaseCount` из БД

### `src/pages/admin/Products.tsx`
- **Форма редактирования товара** (вкладка "Основне")
  - Поле ввода: "Цільові продажі в день" (`dailySalesTarget`)
  - Позволяет редактировать целевое количество продаж в день
  - При сохранении отправляется на сервер как `dailySalesTarget`

### `src/components/SocialProof.tsx`
- **Уведомления типа "purchased_today"**
  - Использует `getTodayPurchases(product)` для расчета количества покупок "сегодня"
  - Функция `getTodayPurchases` использует `dailySalesTarget` из объекта товара

## Итого:
1. **Хранение:** БД (`products.daily_sales_target`)
2. **Обновление БД:** Скрипт `updatePurchaseCounts()` обновляет `purchase_count` каждый час
3. **Редактирование:** Админ-панель (`/admin/products`) - поле "Цільові продажі в день"
4. **Использование:**
   - Для обновления `purchase_count` в БД (скрипт на сервере)
   - Для расчета промежуточных значений в Social Proof уведомлениях (фронтенд)
