-- Заполнение тестовыми данными
-- Исправленная версия с учетом автоинкрементных id

-- Опции товаров (используем code для идентификации)
INSERT INTO product_options (code, name, price, description) VALUES
('gift-wrap', 'Подарункова упаковка', 75.00, 'Красива святкова упаковка з бантом'),
('card', 'Листівка з побажанням', 35.00, 'Персоналізована листівка'),
('extra-templates', 'Додаткові шаблони', 120.00, '15+ ексклюзивних шаблонів'),
('masterclass', 'Відео майстер-клас', 199.00, 'Доступ до 5 відео-уроків'),
('consultation', 'Консультація майстра', 150.00, '30 хв онлайн-консультації')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), description=VALUES(description);

-- Товары (используем code для идентификации)
INSERT INTO products (code, name, slug, short_description, full_description, base_price, sale_price, badge, stock, view_count, purchase_count, display_order) VALUES
('starter', 'Стартовий набір', 'starter', 'Ідеальний старт для новачків. Усе необхідне для перших виробів.', 'Набір "Стартовий" створений спеціально для тих, хто тільки починає свій творчий шлях у світі фетру. Містить базові матеріали та інструменти, а також прості шаблони для перших виробів. Ідеально підходить для занять з дітьми від 3 років під наглядом дорослих.', 890.00, 845.00, 'hit', 15, 234, 89, 1),
('optimal', 'Оптимальний набір', 'optimal', 'Найпопулярніший вибір! Розширений набір для творчості всією родиною.', 'Набір "Оптимальний" — це наш бестселер! Ідеальний баланс між ціною та можливостями. Містить розширену палітру кольорів, професійні інструменти та понад 20 шаблонів різної складності. Підходить для всієї родини — від малюків до дорослих.', 1890.00, 1750.00, 'recommended', 23, 456, 178, 2),
('premium', 'Преміум набір', 'premium', 'Максимум можливостей! Для справжніх ентузіастів та професіоналів.', 'Набір "Преміум" — це вершина нашої колекції! Величезний вибір матеріалів, професійні інструменти японської якості, ексклюзивні шаблони та повний доступ до нашої бібліотеки майстер-класів. Ідеальний вибір для тих, хто хоче створювати справжні шедеври.', 2990.00, 2690.00, 'limited', 8, 312, 67, 3)
ON DUPLICATE KEY UPDATE 
  name=VALUES(name), slug=VALUES(slug), short_description=VALUES(short_description), 
  full_description=VALUES(full_description), base_price=VALUES(base_price), 
  sale_price=VALUES(sale_price), badge=VALUES(badge), stock=VALUES(stock), 
  view_count=VALUES(view_count), purchase_count=VALUES(purchase_count), 
  display_order=VALUES(display_order);

-- Изображения товаров (используем product_id по code через JOIN)
INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 1 FROM products p WHERE p.code = 'starter'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800', 2 FROM products p WHERE p.code = 'starter'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', 3 FROM products p WHERE p.code = 'starter'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800', 1 FROM products p WHERE p.code = 'optimal'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800', 2 FROM products p WHERE p.code = 'optimal'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 3 FROM products p WHERE p.code = 'optimal'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 1 FROM products p WHERE p.code = 'premium'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800', 2 FROM products p WHERE p.code = 'premium'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800', 3 FROM products p WHERE p.code = 'premium'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', 4 FROM products p WHERE p.code = 'premium'
ON DUPLICATE KEY UPDATE url=VALUES(url), sort_order=VALUES(sort_order);

-- Связь товаров и опций (используем JOIN для получения id)
INSERT INTO product_product_options (product_id, option_id)
SELECT p.id, po.id 
FROM products p, product_options po 
WHERE p.code = 'starter' AND po.code IN ('gift-wrap', 'card', 'extra-templates', 'masterclass', 'consultation')
ON DUPLICATE KEY UPDATE product_id=VALUES(product_id), option_id=VALUES(option_id);

INSERT INTO product_product_options (product_id, option_id)
SELECT p.id, po.id 
FROM products p, product_options po 
WHERE p.code = 'optimal' AND po.code IN ('gift-wrap', 'card', 'extra-templates', 'masterclass', 'consultation')
ON DUPLICATE KEY UPDATE product_id=VALUES(product_id), option_id=VALUES(option_id);

INSERT INTO product_product_options (product_id, option_id)
SELECT p.id, po.id 
FROM products p, product_options po 
WHERE p.code = 'premium' AND po.code IN ('gift-wrap', 'card', 'extra-templates', 'masterclass', 'consultation')
ON DUPLICATE KEY UPDATE product_id=VALUES(product_id), option_id=VALUES(option_id);

-- Характеристики товаров (features, materials, canMake, suitableFor)
-- Стартовый набор
INSERT INTO product_features (product_id, type, value, description, sort_order) VALUES
((SELECT id FROM products WHERE code = 'starter'), 'feature', '10 кольорів фетру (15×15 см)', NULL, 0),
((SELECT id FROM products WHERE code = 'starter'), 'feature', 'Базовий набір інструментів', NULL, 1),
((SELECT id FROM products WHERE code = 'starter'), 'feature', '5 простих шаблонів', NULL, 2),
((SELECT id FROM products WHERE code = 'starter'), 'feature', 'Інструкція для початківців', NULL, 3),
((SELECT id FROM products WHERE code = 'starter'), 'material', 'Фетр 1 мм', 'Мʼякий корейський фетр, безпечний для дітей', 0),
((SELECT id FROM products WHERE code = 'starter'), 'material', 'Ножиці', 'Дитячі безпечні ножиці з округлими кінцями', 1),
((SELECT id FROM products WHERE code = 'starter'), 'material', 'Нитки', 'Набір ниток 5 кольорів', 2),
((SELECT id FROM products WHERE code = 'starter'), 'material', 'Голки', 'Пластикові голки для дітей', 3),
((SELECT id FROM products WHERE code = 'starter'), 'material', 'Клей', 'Нетоксичний клей для тканини', 4),
((SELECT id FROM products WHERE code = 'starter'), 'can_make', 'Прості аплікації', NULL, 0),
((SELECT id FROM products WHERE code = 'starter'), 'can_make', 'Закладки для книг', NULL, 1),
((SELECT id FROM products WHERE code = 'starter'), 'can_make', 'Брелоки', NULL, 2),
((SELECT id FROM products WHERE code = 'starter'), 'can_make', 'Магніти на холодильник', NULL, 3),
((SELECT id FROM products WHERE code = 'starter'), 'can_make', 'Ялинкові прикраси', NULL, 4),
((SELECT id FROM products WHERE code = 'starter'), 'suitable_for', 'Діти від 3 років', NULL, 0),
((SELECT id FROM products WHERE code = 'starter'), 'suitable_for', 'Початківці', NULL, 1),
((SELECT id FROM products WHERE code = 'starter'), 'suitable_for', 'Заняття в садочку', NULL, 2);

-- Оптимальный набор
INSERT INTO product_features (product_id, type, value, description, sort_order)
SELECT id, 'feature', '20 кольорів фетру (20×20 см)', NULL, 0 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'feature', 'Повний набір інструментів', NULL, 1 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'feature', '20+ шаблонів різної складності', NULL, 2 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'feature', 'Відео-інструкції', NULL, 3 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'feature', 'Фурнітура (очі, носики, бантики)', NULL, 4 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'material', 'Фетр 1 мм', 'Мʼякий корейський фетр 15 кольорів', 0 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'material', 'Фетр 2 мм', 'Жорсткий фетр для основи, 5 кольорів', 1 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'material', 'Інструменти', 'Ножиці, пінцет, шило, маркер', 2 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'material', 'Нитки', 'Набір ниток 10 кольорів + муліне', 3 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'material', 'Наповнювач', 'Холлофайбер для обʼємних іграшок', 4 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'material', 'Фурнітура', 'Очі, носики, ґудзики, стрічки', 5 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'can_make', 'М\'які іграшки', NULL, 0 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'can_make', 'Мобілі для малюків', NULL, 1 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'can_make', 'Розвиваючі книжки', NULL, 2 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'can_make', 'Пальчикові ляльки', NULL, 3 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'can_make', 'Декор для свят', NULL, 4 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'can_make', 'Корони та маски', NULL, 5 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'can_make', 'Бантики та заколки', NULL, 6 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'suitable_for', 'Вся родина', NULL, 0 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'suitable_for', 'Садочок', NULL, 1 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'suitable_for', 'Школа', NULL, 2 FROM products WHERE code = 'optimal'
UNION ALL SELECT id, 'suitable_for', 'Подарунок', NULL, 3 FROM products WHERE code = 'optimal'
ON DUPLICATE KEY UPDATE value=VALUES(value), description=VALUES(description), sort_order=VALUES(sort_order);

-- Преміум набор
INSERT INTO product_features (product_id, type, value, description, sort_order)
SELECT id, 'feature', '40 кольорів фетру (30×30 см)', NULL, 0 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'feature', 'Професійні інструменти', NULL, 1 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'feature', '50+ ексклюзивних шаблонів', NULL, 2 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'feature', 'Повний доступ до відео-курсу', NULL, 3 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'feature', 'Преміум фурнітура', NULL, 4 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'feature', 'Подарункова упаковка', NULL, 5 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'feature', 'Консультація майстра', NULL, 6 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'material', 'Фетр преміум', 'Італійський та корейський фетр, 30 кольорів', 0 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'material', 'Фетр з принтом', '10 дизайнів з візерунками', 1 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'material', 'Інструменти', 'Японські ножиці, пінцет, плоттер', 2 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'material', 'Нитки', 'DMC муліне 20 кольорів', 3 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'material', 'Наповнювач', 'Преміум холлофайбер + гранулят', 4 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'material', 'Фурнітура', 'Повний набір: очі, носи, суглоби, магніти', 5 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'material', 'Аксесуари', 'Стрічки, мереживо, бісер, паєтки', 6 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'can_make', 'Авторські іграшки', NULL, 0 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'can_make', 'Інтер\'єрні ляльки', NULL, 1 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'can_make', 'Розвиваючі ігри', NULL, 2 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'can_make', 'Тематичні набори', NULL, 3 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'can_make', 'Весільний декор', NULL, 4 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'can_make', 'Іменні подарунки', NULL, 5 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'can_make', 'Все з попередніх наборів', NULL, 6 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'suitable_for', 'Професіонали', NULL, 0 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'suitable_for', 'Ентузіасти', NULL, 1 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'suitable_for', 'Подарунок преміум', NULL, 2 FROM products WHERE code = 'premium'
UNION ALL SELECT id, 'suitable_for', 'Бізнес', NULL, 3 FROM products WHERE code = 'premium'
ON DUPLICATE KEY UPDATE value=VALUES(value), description=VALUES(description), sort_order=VALUES(sort_order);

-- Настройки магазина
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
('notify_on_delivery', 'false', 'boolean', 'Сповіщення про доставку')
ON DUPLICATE KEY UPDATE value=VALUES(value), type=VALUES(type), description=VALUES(description);

-- FAQ
INSERT INTO faqs (question, answer, sort_order, is_published) VALUES
('Для якого віку підходять ваші набори?', 'Наші набори підходять для дітей від 3 років (під наглядом дорослих) і до нескінченності! Стартовий набір ідеальний для малюків, Оптимальний — для всієї родини, а Преміум — для тих, хто хоче творити на професійному рівні.', 1, TRUE),
('Чи безпечний фетр для дітей?', 'Так, абсолютно! Ми використовуємо тільки сертифікований корейський та італійський фетр, який не містить токсичних речовин. Усі матеріали пройшли перевірку на відповідність стандартам безпеки для дітей.', 2, TRUE),
('Як швидко ви відправляєте замовлення?', 'Ми відправляємо замовлення кожного будного дня о 17:00. Якщо ви оформите замовлення до 16:00 у будній день — відправимо того ж дня! У вихідні найближча відправка — у понеділок.', 3, TRUE),
('Яка різниця між наборами?', 'Головна різниця — у кількості матеріалів та складності проєктів. Стартовий містить базовий набір для простих виробів. Оптимальний — розширений набір для різноманітних проєктів. Преміум — максимум можливостей для створення справжніх шедеврів.', 4, TRUE),
('Що робити, якщо я не вмію шити?', 'Це взагалі не проблема! До кожного набору додаються детальні інструкції, а в Оптимальному та Преміум наборах є відео-уроки. Багато виробів можна робити взагалі без шиття — на клей! Також ви завжди можете замовити консультацію майстра.', 5, TRUE),
('Чи можна замовити додаткові матеріали?', 'Так, звичайно! Ви можете додати до замовлення будь-які опції: додаткові шаблони, відео майстер-класи, консультацію майстра. Також скоро ми запустимо окремий розділ з додатковими матеріалами.', 6, TRUE),
('Як доглядати за виробами з фетру?', 'Вироби з фетру можна обережно прати вручну в теплій воді з м\'яким миючим засобом. Не викручуйте, а промокніть рушником і сушіть на рівній поверхні. Фетр не терпить високих температур, тому не сушіть на батареї.', 7, TRUE),
('Чи є у вас самовивіз?', 'Так! Ви можете забрати замовлення самостійно за адресою: Київ, вул. Урлівська 30. Графік роботи: Пн-Пт 10:00-18:00, Сб 10:00-14:00. Неділя — вихідний.', 8, TRUE)
ON DUPLICATE KEY UPDATE question=VALUES(question), answer=VALUES(answer), sort_order=VALUES(sort_order), is_published=VALUES(is_published);

-- Команда
INSERT INTO team_members (name, role, photo, description, sort_order, is_active) VALUES
('Ольга Мельник', 'Засновниця та головний майстер', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', '12 років досвіду роботи з фетром. Авторка унікальних технік та шаблонів. Провела понад 500 майстер-класів.', 1, TRUE),
('Марія Коваленко', 'Дизайнер шаблонів', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Художник-ілюстратор за освітою. Створює чарівні дизайни, які закохують з першого погляду.', 2, TRUE),
('Анна Шевченко', 'Менеджер з клієнтами', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Завжди на звʼязку та готова допомогти з будь-яким питанням. Ваш провідник у світі фетру.', 3, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), photo=VALUES(photo), description=VALUES(description), sort_order=VALUES(sort_order), is_active=VALUES(is_active);

-- Галерея
INSERT INTO gallery_images (url, title, sort_order, is_published) VALUES
('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Мобіль для малюка', 1, TRUE),
('https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', 'Розвиваюча книжка', 2, TRUE),
('https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600', 'Пальчикові ляльки', 3, TRUE),
('https://images.unsplash.com/photo-1544816155-12df9643f363?w=600', 'Ялинкові іграшки', 4, TRUE),
('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Корона принцеси', 5, TRUE),
('https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', 'Бантики', 6, TRUE)
ON DUPLICATE KEY UPDATE url=VALUES(url), title=VALUES(title), sort_order=VALUES(sort_order), is_published=VALUES(is_published);

-- Отзывы
INSERT INTO reviews (name, text, rating, is_approved, created_at) VALUES
('Олена М.', 'Замовляла Оптимальний набір для доньки на день народження. Дитина в захваті! Вже зробили мобіль для братика. Якість матеріалів чудова, все продумано до дрібниць. Дякую!', 5, TRUE, '2024-12-15'),
('Ірина К.', 'Це вже третє моє замовлення! Почала зі Стартового, тепер замовила Преміум. Не можу зупинитися 😊 Рекомендую всім мамам, це чудовий спосіб провести час з дітьми.', 5, TRUE, '2024-12-10'),
('Наталія В.', 'Купувала набір для садочка, діти в захваті! Вихователі теж задоволені — все організовано, зрозумілі інструкції. Відправили швидко, упаковка — на 5+!', 5, TRUE, '2024-12-08'),
('Марина Л.', 'Подарувала мамі на ювілей — вона давно хотіла спробувати щось творче. Тепер не відірвати від фетру! Дякую за чудовий подарунок та швидку доставку.', 5, TRUE, '2024-12-01')
ON DUPLICATE KEY UPDATE name=VALUES(name), text=VALUES(text), rating=VALUES(rating), is_approved=VALUES(is_approved);

