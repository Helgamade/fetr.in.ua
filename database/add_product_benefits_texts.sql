-- Добавление текстов для карточки товара (Benefits section)
-- Выполнить для добавления текстов в site_texts

INSERT INTO site_texts (`key`, value, namespace, description) VALUES
('product.benefits.freeDelivery', 'Безкоштовна доставка від 1500 ₴', 'product', 'Текст бесплатной доставки в карточке товара'),
('product.benefits.quality', 'Гарантія якості', 'product', 'Текст гарантии качества в карточке товара'),
('product.benefits.gift', 'Подарунок до замовлення', 'product', 'Текст подарка к заказу в карточке товара')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);
