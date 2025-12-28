# Настройка системы управления текстами сайта

## Шаги установки

### 1. Создать таблицу в БД

Выполните SQL из файла `database/create_site_texts_table.sql`:

```sql
CREATE TABLE IF NOT EXISTS site_texts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Формат: namespace.key (например, nav.home)',
  value TEXT NOT NULL,
  namespace VARCHAR(100) NOT NULL COMMENT 'Категория/namespace для группировки',
  description VARCHAR(500) COMMENT 'Описание для админ-панели',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_namespace (namespace),
  INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Загрузить начальные тексты

Выполните SQL из файла `database/seed_site_texts.sql` для загрузки начальных текстов.

## Использование

### В админ-панели

1. Перейдите в раздел **"Тексти сайту"** в админ-панели
2. Выберите нужный namespace (nav, hero, about, footer и т.д.)
3. Отредактируйте нужные тексты
4. Нажмите "Зберегти"

### В коде компонентов

Используйте хук `useTranslation` как в i18next:

```typescript
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  // С указанием namespace
  const { t } = useTranslation('nav');
  return <button>{t('home')}</button>; // Вернет значение для 'nav.home'
  
  // Или без namespace
  const { t } = useTranslation();
  return <h1>{t('hero.title')}</h1>; // Вернет значение для 'hero.title'
}
```

## Формат ключей

Все ключи должны быть в формате: `namespace.key`

Примеры:
- `nav.home` - навигация, пункт "Главная"
- `hero.title` - Hero секция, заголовок
- `about.subtitle` - Секция "О нас", подзаголовок

## Структура namespace

- `nav` - Навигация
- `hero` - Hero секция
- `about` - Секция "О нас"
- `footer` - Footer
- `common` - Общие тексты

## Миграция на i18next в будущем

Система полностью совместима с i18next:

1. Экспортируйте тексты из БД в JSON файлы по namespace
2. Замените `useTranslation` из `@/hooks/useTranslation` на `react-i18next`
3. Ключи уже в правильном формате, код останется прежним

Пример экспорта для i18next:
```sql
-- Экспорт для uk/common.json
SELECT CONCAT('  "', `key`, '": "', REPLACE(value, '"', '\\"'), '",') 
FROM site_texts 
WHERE namespace = 'common' 
ORDER BY `key`;
```

