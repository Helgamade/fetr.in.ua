-- Добавление недостающих текстов в site_texts
-- Выполнить этот файл после seed_site_texts.sql

INSERT INTO site_texts (`key`, value, namespace, description) VALUES
-- Products section
('products.badge', 'Наші набори', 'products', 'Бейдж в секції товарів'),
('products.title', 'Оберіть свій ідеальний набір', 'products', 'Заголовок секції товарів'),
('products.subtitle', 'Три набори для будь-якого рівня майстерності. Від початківців до професіоналів — знайдеться щось для кожного!', 'products', 'Підзаголовок секції товарів'),
('products.loading', 'Завантаження товарів...', 'products', 'Сообщение при загрузке товаров'),
('products.cta.title', 'Безкоштовна доставка при замовленні від 1500 ₴', 'products', 'CTA в секції товарів'),
('products.cta.subtitle', 'Не можете обрати? Порівняйте всі набори нижче!', 'products', 'CTA подзаголовок в секції товарів'),

-- Comparison section
('comparison.recommend.title', 'Рекомендуємо: Оптимальний набір', 'comparison', 'Заголовок рекомендации в секції сравнения'),
('comparison.recommend.subtitle', 'Найкраще співвідношення ціни та можливостей', 'comparison', 'Подзаголовок рекомендации'),
('comparison.recommend.button', 'Замовити зараз', 'comparison', 'Кнопка заказа в рекомендации'),

-- Reviews section
('reviews.badge', 'Відгуки', 'reviews', 'Бейдж в секції відгуків'),
('reviews.title', 'Що кажуть наші клієнти', 'reviews', 'Заголовок секції відгуків'),
('reviews.subtitle', 'Реальні відгуки від щасливих мам та їхніх діток', 'reviews', 'Підзаголовок секції відгуків'),

-- Gallery section
('gallery.badge', 'Натхнення', 'gallery', 'Бейдж в секції галереї'),
('gallery.title', 'Що можна зробити', 'gallery', 'Заголовок секції галереї'),
('gallery.subtitle', 'Ось лише деякі ідеї того, що можна створити з наших наборів. Ваша фантазія — єдине обмеження!', 'gallery', 'Підзаголовок секції галереї'),
('gallery.loading', 'Завантаження галереї...', 'gallery', 'Сообщение при загрузке галереи'),

-- FAQ section
('faq.badge', 'Часті питання', 'faq', 'Бейдж в секції FAQ'),
('faq.title', 'Відповіді на ваші питання', 'faq', 'Заголовок секції FAQ'),
('faq.subtitle', 'Знайдіть відповіді на найпоширеніші запитання', 'faq', 'Підзаголовок секції FAQ'),
('faq.loading', 'Завантаження питань...', 'faq', 'Сообщение при загрузке FAQ'),
('faq.cta.title', 'Не знайшли відповіді на своє питання?', 'faq', 'CTA заголовок в секції FAQ'),

-- Instagram section
('instagram.badge', 'Слідкуйте за нами', 'instagram', 'Бейдж в секції Instagram'),
('instagram.title', '@helgamade_ua', 'instagram', 'Заголовок секції Instagram'),
('instagram.subtitle', 'Ідеї, натхнення та закулісся нашої майстерні в Instagram', 'instagram', 'Підзаголовок секції Instagram'),
('instagram.loading', 'Завантаження постів Instagram...', 'instagram', 'Сообщение при загрузке постов Instagram'),
('instagram.button', 'Підписатися', 'instagram', 'Кнопка подписки в секції Instagram'),

-- Contact section
('contact.badge', 'Контакти', 'contact', 'Бейдж в секції контактів'),
('contact.title', 'Зв''яжіться з нами', 'contact', 'Заголовок секції контактів'),
('contact.subtitle', 'Ми завжди раді відповісти на ваші запитання', 'contact', 'Підзаголовок секції контактів'),
('contact.address.pickup', 'Самовивіз за попереднім записом', 'contact', 'Текст под адресой - самовывоз по записи'),
('contact.phone.messengers', 'Viber, Telegram, WhatsApp', 'contact', 'Текст под телефоном - мессенджеры'),
('contact.email.responseTime', 'Відповідаємо протягом 24 годин', 'contact', 'Текст под email - время ответа'),

-- Index page CTA sections
('index.cta_mid.title', 'Готові розпочати творчу подорож?', 'index', 'Заголовок CTA в середине страницы'),
('index.cta_mid.subtitle', 'Приєднуйтесь до тисяч задоволених мам, які вже обрали наші набори для розвитку своїх діток', 'index', 'Подзаголовок CTA в середине страницы'),
('index.cta_mid.button', 'Обрати набір зараз', 'index', 'Кнопка CTA в середине страницы'),

('index.guarantee.title', 'Гарантія задоволення', 'index', 'Заголовок гарантии'),
('index.guarantee.text', 'Якщо набір вам не підійде — повернемо гроші протягом 14 днів без зайвих питань. Ми впевнені в якості наших матеріалів!', 'index', 'Текст гарантии'),

('index.cta_final.title', 'Не відкладайте творчість на потім!', 'index', 'Заголовок финального CTA'),
('index.cta_final.subtitle', 'Замовте набір сьогодні та отримайте безкоштовний майстер-клас у подарунок', 'index', 'Подзаголовок финального CTA'),

-- Footer legal links
('footer.legal.privacy', 'Політика конфіденційності', 'footer', 'Ссылка на политику конфиденциальности'),
('footer.legal.terms', 'Умови використання', 'footer', 'Ссылка на условия использования'),
('footer.legal.delivery', 'Доставка та оплата', 'footer', 'Ссылка на доставку и оплату'),
('footer.legal.returns', 'Повернення та обмін', 'footer', 'Ссылка на возврат и обмен')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);

