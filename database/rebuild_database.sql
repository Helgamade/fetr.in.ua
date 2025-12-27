-- Полное пересоздание базы данных
-- Выполняйте этот файл целиком в phpMyAdmin

SET FOREIGN_KEY_CHECKS = 0;

-- Удаляем все таблицы
DROP TABLE IF EXISTS order_item_options;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_product_options;
DROP TABLE IF EXISTS product_features;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_options;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS faqs;
DROP TABLE IF EXISTS gallery_images;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- СОЗДАНИЕ ТАБЛИЦ
-- ============================================

-- Товары
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2) NULL,
  badge ENUM('hit', 'recommended', 'limited') NULL,
  stock INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  purchase_count INT NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_badge (badge)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Опции товаров
CREATE TABLE product_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Изображения товаров
CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Связь товаров и опций
CREATE TABLE product_product_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  option_id INT NOT NULL,
  UNIQUE KEY idx_product_option (product_id, option_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Характеристики товаров
CREATE TABLE product_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('feature', 'material', 'can_make', 'suitable_for') NOT NULL,
  value TEXT NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Заказы
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255) NULL,
  delivery_method ENUM('nova_poshta', 'ukrposhta', 'pickup') NOT NULL,
  delivery_city VARCHAR(255) NULL,
  delivery_warehouse VARCHAR(255) NULL,
  delivery_post_index VARCHAR(20) NULL,
  delivery_address TEXT NULL,
  payment_method ENUM('card', 'cod') NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('created', 'accepted', 'processing', 'awaiting_payment', 'paid', 'assembled', 'packed', 'shipped', 'in_transit', 'arrived', 'completed') NOT NULL DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_number (order_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Позиции заказов
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Опции в позициях заказов
CREATE TABLE order_item_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NOT NULL,
  option_id INT NOT NULL,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES product_options(id),
  INDEX idx_order_item_id (order_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Настройки
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  description TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ
CREATE TABLE faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Отзывы
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  rating INT NULL,
  photo VARCHAR(500) NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Команда
CREATE TABLE team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  photo VARCHAR(500) NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Галерея
CREATE TABLE gallery_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  title VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Пользователи
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Страницы
CREATE TABLE pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  meta_title VARCHAR(255) NULL,
  meta_description TEXT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Параметры сравнения товаров (строки таблицы сравнения)
CREATE TABLE comparison_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Значения параметров сравнения для каждого товара
CREATE TABLE comparison_values (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feature_key VARCHAR(50) NOT NULL,
  product_id INT NOT NULL,
  value TEXT NULL,
  is_boolean BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY idx_feature_product (feature_key, product_id),
  INDEX idx_feature_key (feature_key),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ЗАПОЛНЕНИЕ ДАННЫМИ
-- ============================================

-- Опции
INSERT INTO product_options (code, name, price, description) VALUES
('gift-wrap', 'Подарункова упаковка', 75.00, 'Красива святкова упаковка з бантом'),
('card', 'Листівка з побажанням', 35.00, 'Персоналізована листівка'),
('extra-templates', 'Додаткові шаблони', 120.00, '15+ ексклюзивних шаблонів'),
('masterclass', 'Відео майстер-клас', 199.00, 'Доступ до 5 відео-уроків'),
('consultation', 'Консультація майстра', 150.00, '30 хв онлайн-консультації');

-- Товары
INSERT INTO products (code, name, slug, short_description, full_description, base_price, sale_price, badge, stock, view_count, purchase_count, display_order) VALUES
('starter', 'Стартовий набір', 'starter', 'Ідеальний старт для новачків. Усе необхідне для перших виробів.', 'Набір "Стартовий" створений спеціально для тих, хто тільки починає свій творчий шлях у світі фетру. Містить базові матеріали та інструменти, а також прості шаблони для перших виробів. Ідеально підходить для занять з дітьми від 3 років під наглядом дорослих.', 890.00, 845.00, 'hit', 15, 234, 89, 1),
('optimal', 'Оптимальний набір', 'optimal', 'Найпопулярніший вибір! Розширений набір для творчості всією родиною.', 'Набір "Оптимальний" — це наш бестселер! Ідеальний баланс між ціною та можливостями. Містить розширену палітру кольорів, професійні інструменти та понад 20 шаблонів різної складності. Підходить для всієї родини — від малюків до дорослих.', 1890.00, 1750.00, 'recommended', 23, 456, 178, 2),
('premium', 'Преміум набір', 'premium', 'Максимум можливостей! Для справжніх ентузіастів та професіоналів.', 'Набір "Преміум" — це вершина нашої колекції! Величезний вибір матеріалів, професійні інструменти японської якості, ексклюзивні шаблони та повний доступ до нашої бібліотеки майстер-класів. Ідеальний вибір для тих, хто хоче створювати справжні шедеври.', 2990.00, 2690.00, 'limited', 8, 312, 67, 3);

-- Изображения (product_id будет 1, 2, 3 после вставки товаров)
INSERT INTO product_images (product_id, url, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 1),
(1, 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800', 2),
(1, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', 3),
(2, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800', 1),
(2, 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800', 2),
(2, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 3),
(3, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 1),
(3, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800', 2),
(3, 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800', 3),
(3, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', 4);

-- Связь товаров и опций (product_id: 1=starter, 2=optimal, 3=premium; option_id: 1=gift-wrap, 2=card, 3=extra-templates, 4=masterclass, 5=consultation)
INSERT INTO product_product_options (product_id, option_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5);

-- Характеристики (product_id: 1=starter, 2=optimal, 3=premium)
INSERT INTO product_features (product_id, type, value, description, sort_order) VALUES
-- Стартовый (1)
(1, 'feature', '10 кольорів фетру (15×15 см)', NULL, 0),
(1, 'feature', 'Базовий набір інструментів', NULL, 1),
(1, 'feature', '5 простих шаблонів', NULL, 2),
(1, 'feature', 'Інструкція для початківців', NULL, 3),
(1, 'material', 'Фетр 1 мм', 'Мʼякий корейський фетр, безпечний для дітей', 0),
(1, 'material', 'Ножиці', 'Дитячі безпечні ножиці з округлими кінцями', 1),
(1, 'material', 'Нитки', 'Набір ниток 5 кольорів', 2),
(1, 'material', 'Голки', 'Пластикові голки для дітей', 3),
(1, 'material', 'Клей', 'Нетоксичний клей для тканини', 4),
(1, 'can_make', 'Прості аплікації', NULL, 0),
(1, 'can_make', 'Закладки для книг', NULL, 1),
(1, 'can_make', 'Брелоки', NULL, 2),
(1, 'can_make', 'Магніти на холодильник', NULL, 3),
(1, 'can_make', 'Ялинкові прикраси', NULL, 4),
(1, 'suitable_for', 'Діти від 3 років', NULL, 0),
(1, 'suitable_for', 'Початківці', NULL, 1),
(1, 'suitable_for', 'Заняття в садочку', NULL, 2),
-- Оптимальный (2)
(2, 'feature', '20 кольорів фетру (20×20 см)', NULL, 0),
(2, 'feature', 'Повний набір інструментів', NULL, 1),
(2, 'feature', '20+ шаблонів різної складності', NULL, 2),
(2, 'feature', 'Відео-інструкції', NULL, 3),
(2, 'feature', 'Фурнітура (очі, носики, бантики)', NULL, 4),
(2, 'material', 'Фетр 1 мм', 'Мʼякий корейський фетр 15 кольорів', 0),
(2, 'material', 'Фетр 2 мм', 'Жорсткий фетр для основи, 5 кольорів', 1),
(2, 'material', 'Інструменти', 'Ножиці, пінцет, шило, маркер', 2),
(2, 'material', 'Нитки', 'Набір ниток 10 кольорів + муліне', 3),
(2, 'material', 'Наповнювач', 'Холлофайбер для обʼємних іграшок', 4),
(2, 'material', 'Фурнітура', 'Очі, носики, ґудзики, стрічки', 5),
(2, 'can_make', 'М\'які іграшки', NULL, 0),
(2, 'can_make', 'Мобілі для малюків', NULL, 1),
(2, 'can_make', 'Розвиваючі книжки', NULL, 2),
(2, 'can_make', 'Пальчикові ляльки', NULL, 3),
(2, 'can_make', 'Декор для свят', NULL, 4),
(2, 'can_make', 'Корони та маски', NULL, 5),
(2, 'can_make', 'Бантики та заколки', NULL, 6),
(2, 'suitable_for', 'Вся родина', NULL, 0),
(2, 'suitable_for', 'Садочок', NULL, 1),
(2, 'suitable_for', 'Школа', NULL, 2),
(2, 'suitable_for', 'Подарунок', NULL, 3),
-- Преміум (3)
(3, 'feature', '40 кольорів фетру (30×30 см)', NULL, 0),
(3, 'feature', 'Професійні інструменти', NULL, 1),
(3, 'feature', '50+ ексклюзивних шаблонів', NULL, 2),
(3, 'feature', 'Повний доступ до відео-курсу', NULL, 3),
(3, 'feature', 'Преміум фурнітура', NULL, 4),
(3, 'feature', 'Подарункова упаковка', NULL, 5),
(3, 'feature', 'Консультація майстра', NULL, 6),
(3, 'material', 'Фетр преміум', 'Італійський та корейський фетр, 30 кольорів', 0),
(3, 'material', 'Фетр з принтом', '10 дизайнів з візерунками', 1),
(3, 'material', 'Інструменти', 'Японські ножиці, пінцет, плоттер', 2),
(3, 'material', 'Нитки', 'DMC муліне 20 кольорів', 3),
(3, 'material', 'Наповнювач', 'Преміум холлофайбер + гранулят', 4),
(3, 'material', 'Фурнітура', 'Повний набір: очі, носи, суглоби, магніти', 5),
(3, 'material', 'Аксесуари', 'Стрічки, мереживо, бісер, паєтки', 6),
(3, 'can_make', 'Авторські іграшки', NULL, 0),
(3, 'can_make', 'Інтер\'єрні ляльки', NULL, 1),
(3, 'can_make', 'Розвиваючі ігри', NULL, 2),
(3, 'can_make', 'Тематичні набори', NULL, 3),
(3, 'can_make', 'Весільний декор', NULL, 4),
(3, 'can_make', 'Іменні подарунки', NULL, 5),
(3, 'can_make', 'Все з попередніх наборів', NULL, 6),
(3, 'suitable_for', 'Професіонали', NULL, 0),
(3, 'suitable_for', 'Ентузіасти', NULL, 1),
(3, 'suitable_for', 'Подарунок преміум', NULL, 2),
(3, 'suitable_for', 'Бізнес', NULL, 3);

-- Настройки
INSERT INTO settings (key_name, value, type, description) VALUES
('store_name', 'FeltMagic', 'string', 'Назва магазину'),
('store_email', 'info@feltmagic.ua', 'string', 'Email магазину'),
('store_phone', '+380501234567', 'string', 'Телефон магазину'),
('store_address', 'м. Київ, вул. Урлівська 30', 'string', 'Адреса магазину'),
('store_working_hours', 'Пн-Пт 10:00-18:00, Сб 10:00-14:00', 'string', 'Години роботи'),
('free_delivery_threshold', '1500', 'number', 'Мінімальна сума для безкоштовної доставки'),
('delivery_cost', '70', 'number', 'Вартість доставки'),
('nova_poshta_enabled', 'true', 'boolean', 'Увімкнено доставку Нова Пошта'),
('ukrposhta_enabled', 'true', 'boolean', 'Увімкнено доставку Укрпошта'),
('pickup_enabled', 'true', 'boolean', 'Увімкнено самовивіз'),
('email_notifications', 'true', 'boolean', 'Email сповіщення'),
('sms_notifications', 'false', 'boolean', 'SMS сповіщення'),
('telegram_notifications', 'true', 'boolean', 'Telegram сповіщення'),
('notify_on_new_order', 'true', 'boolean', 'Сповіщення про нове замовлення'),
('notify_on_payment', 'true', 'boolean', 'Сповіщення про оплату'),
('notify_on_delivery', 'false', 'boolean', 'Сповіщення про доставку');

-- FAQ
INSERT INTO faqs (question, answer, sort_order, is_published) VALUES
('Для якого віку підходять ваші набори?', 'Наші набори підходять для дітей від 3 років (під наглядом дорослих) і до нескінченності! Стартовий набір ідеальний для малюків, Оптимальний — для всієї родини, а Преміум — для тих, хто хоче творити на професійному рівні.', 1, TRUE),
('Чи безпечний фетр для дітей?', 'Так, абсолютно! Ми використовуємо тільки сертифікований корейський та італійський фетр, який не містить токсичних речовин. Усі матеріали пройшли перевірку на відповідність стандартам безпеки для дітей.', 2, TRUE),
('Як швидко ви відправляєте замовлення?', 'Ми відправляємо замовлення кожного будного дня о 17:00. Якщо ви оформите замовлення до 16:00 у будній день — відправимо того ж дня! У вихідні найближча відправка — у понеділок.', 3, TRUE),
('Яка різниця між наборами?', 'Головна різниця — у кількості матеріалів та складності проєктів. Стартовий містить базовий набір для простих виробів. Оптимальний — розширений набір для різноманітних проєктів. Преміум — максимум можливостей для створення справжніх шедеврів.', 4, TRUE),
('Що робити, якщо я не вмію шити?', 'Це взагалі не проблема! До кожного набору додаються детальні інструкції, а в Оптимальному та Преміум наборах є відео-уроки. Багато виробів можна робити взагалі без шиття — на клей! Також ви завжди можете замовити консультацію майстра.', 5, TRUE),
('Чи можна замовити додаткові матеріали?', 'Так, звичайно! Ви можете додати до замовлення будь-які опції: додаткові шаблони, відео майстер-класи, консультацію майстра. Також скоро ми запустимо окремий розділ з додатковими матеріалами.', 6, TRUE),
('Як доглядати за виробами з фетру?', 'Вироби з фетру можна обережно прати вручну в теплій воді з м\'яким миючим засобом. Не викручуйте, а промокніть рушником і сушіть на рівній поверхні. Фетр не терпить високих температур, тому не сушіть на батареї.', 7, TRUE),
('Чи є у вас самовивіз?', 'Так! Ви можете забрати замовлення самостійно за адресою: Київ, вул. Урлівська 30. Графік роботи: Пн-Пт 10:00-18:00, Сб 10:00-14:00. Неділя — вихідний.', 8, TRUE);

-- Отзывы
INSERT INTO reviews (name, text, rating, is_approved, created_at) VALUES
('Олена М.', 'Замовляла Оптимальний набір для доньки на день народження. Дитина в захваті! Вже зробили мобіль для братика. Якість матеріалів чудова, все продумано до дрібниць. Дякую!', 5, TRUE, '2024-12-15'),
('Ірина К.', 'Це вже третє моє замовлення! Почала зі Стартового, тепер замовила Преміум. Не можу зупинитися 😊 Рекомендую всім мамам, це чудовий спосіб провести час з дітьми.', 5, TRUE, '2024-12-10'),
('Наталія В.', 'Купувала набір для садочка, діти в захваті! Вихователі теж задоволені — все організовано, зрозумілі інструкції. Відправили швидко, упаковка — на 5+!', 5, TRUE, '2024-12-08'),
('Марина Л.', 'Подарувала мамі на ювілей — вона давно хотіла спробувати щось творче. Тепер не відірвати від фетру! Дякую за чудовий подарунок та швидку доставку.', 5, TRUE, '2024-12-01');

-- Команда
INSERT INTO team_members (name, role, photo, description, sort_order, is_active) VALUES
('Ольга Мельник', 'Засновниця та головний майстер', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', '12 років досвіду роботи з фетром. Авторка унікальних технік та шаблонів. Провела понад 500 майстер-класів.', 1, TRUE),
('Марія Коваленко', 'Дизайнер шаблонів', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Художник-ілюстратор за освітою. Створює чарівні дизайни, які закохують з першого погляду.', 2, TRUE),
('Анна Шевченко', 'Менеджер з клієнтами', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Завжди на звʼязку та готова допомогти з будь-яким питанням. Ваш провідник у світі фетру.', 3, TRUE);

-- Галерея
INSERT INTO gallery_images (url, title, sort_order, is_published) VALUES
('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Мобіль для малюка', 1, TRUE),
('https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', 'Розвиваюча книжка', 2, TRUE),
('https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600', 'Пальчикові ляльки', 3, TRUE),
('https://images.unsplash.com/photo-1544816155-12df9643f363?w=600', 'Ялинкові іграшки', 4, TRUE),
('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Корона принцеси', 5, TRUE),
('https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', 'Бантики', 6, TRUE);

-- Параметры сравнения
INSERT INTO comparison_features (key_name, label, sort_order) VALUES
('colors', 'Кількість кольорів фетру', 0),
('size', 'Розмір листів фетру', 1),
('tools', 'Інструменти', 2),
('templates', 'Шаблони', 3),
('video', 'Відео-інструкції', 4),
('furniture', 'Фурнітура', 5),
('filler', 'Наповнювач', 6),
('consultation', 'Консультація майстра', 7),
('gift', 'Подарункова упаковка', 8),
('suitable', 'Рекомендовано для', 9);

-- Значения сравнения для товаров (product_id: 1=starter, 2=optimal, 3=premium)
INSERT INTO comparison_values (feature_key, product_id, value, is_boolean) VALUES
-- Стартовый (1)
('colors', 1, '10 кольорів', FALSE),
('size', 1, '15×15 см', FALSE),
('tools', 1, 'Базовий набір', FALSE),
('templates', 1, '5 шаблонів', FALSE),
('video', 1, NULL, TRUE),
('furniture', 1, NULL, TRUE),
('filler', 1, NULL, TRUE),
('consultation', 1, NULL, TRUE),
('gift', 1, NULL, TRUE),
('suitable', 1, 'Діти 3+, початківці', FALSE),
-- Оптимальный (2)
('colors', 2, '20 кольорів', FALSE),
('size', 2, '20×20 см', FALSE),
('tools', 2, 'Повний набір', FALSE),
('templates', 2, '20+ шаблонів', FALSE),
('video', 2, 'true', TRUE),
('furniture', 2, 'true', TRUE),
('filler', 2, 'true', TRUE),
('consultation', 2, NULL, TRUE),
('gift', 2, NULL, TRUE),
('suitable', 2, 'Вся родина, садок, школа', FALSE),
-- Преміум (3)
('colors', 3, '40 кольорів', FALSE),
('size', 3, '30×30 см', FALSE),
('tools', 3, 'Професійні', FALSE),
('templates', 3, '50+ шаблонів', FALSE),
('video', 3, 'true', TRUE),
('furniture', 3, 'true', TRUE),
('filler', 3, 'true', TRUE),
('consultation', 3, 'true', TRUE),
('gift', 3, 'true', TRUE),
('suitable', 3, 'Професіонали, ентузіасти', FALSE);

