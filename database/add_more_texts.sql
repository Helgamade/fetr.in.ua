-- Добавление оставшихся текстов
INSERT INTO site_texts (`key`, value, namespace, description) VALUES
-- Comparison section header
('comparison.loading', 'Завантаження таблиці порівняння...', 'comparison', 'Сообщение при загрузке сравнения'),
('comparison.title', 'Порівняння наборів', 'comparison', 'Заголовок секції порівняння'),
('comparison.subtitle', 'Детальне порівняння допоможе обрати саме той набір, який підходить вам найкраще', 'comparison', 'Підзаголовок секції порівняння'),
('comparison.parameters', 'Параметри', 'comparison', 'Заголовок колонки параметров в таблице'),

-- Reviews section loading
('reviews.loading', 'Завантаження відгуків...', 'reviews', 'Сообщение при загрузке отзывов'),

-- Index guarantee items
('index.guarantee.safe_payment', 'Безпечна оплата', 'index', 'Элемент гарантии - безопасная оплата'),
('index.guarantee.fast_delivery', 'Швидка доставка', 'index', 'Элемент гарантии - быстрая доставка'),
('index.guarantee.master_support', 'Підтримка майстра', 'index', 'Элемент гарантии - поддержка мастера'),

-- ProductModal
('product.what_can_make', 'Що можна зробити:', 'product', 'Заголовок секции "Что можно сделать" в модальном окне товара')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);

