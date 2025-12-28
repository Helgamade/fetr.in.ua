-- Добавление текстов бейджиков товаров
INSERT INTO site_texts (`key`, value, namespace, description) VALUES
('product.badge.hit', 'Хіт продажів', 'product', 'Бейдж "Хит продажів" на карточке товара'),
('product.badge.recommended', 'Рекомендовано', 'product', 'Бейдж "Рекомендовано" на карточке товара'),
('product.badge.limited', 'Обмежено', 'product', 'Бейдж "Обмежено" на карточке товара')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);

