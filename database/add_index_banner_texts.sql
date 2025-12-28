-- Добавление текстов для баннера и trust banner в Index.tsx
INSERT INTO site_texts (`key`, value, namespace, description) VALUES
('index.banner.text', '🎁 Безкоштовна доставка від 1500 грн • 🚀 Відправка щодня до 17:00 • 💝 Подарунок до кожного замовлення', 'index', 'Текст баннера в верхней части главной страницы'),
('index.trust.experience.label', 'років досвіду', 'index', 'Лейбл статистики опыта в trust banner'),
('index.trust.clients.label', 'щасливих клієнтів', 'index', 'Лейбл статистики клиентов в trust banner'),
('index.trust.quality.label', 'якісні матеріали', 'index', 'Лейбл статистики качества в trust banner'),
('index.trust.support.label', 'підтримка', 'index', 'Лейбл статистики поддержки в trust banner')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);

