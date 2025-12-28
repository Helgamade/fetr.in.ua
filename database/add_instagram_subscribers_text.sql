-- Добавление текста количества подписчиков Instagram
INSERT INTO site_texts (`key`, value, namespace, description) VALUES
('instagram.subscribers_count', 'Вже 12 000+ підписників!', 'instagram', 'Текст с количеством подписчиков Instagram под кнопкой подписки')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);

