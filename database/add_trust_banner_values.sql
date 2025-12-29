-- Добавление значений для trust banner (числовые значения статистики)
INSERT INTO site_texts (`key`, value, namespace, description) VALUES
('index.trust.experience.value', '12+', 'index', 'Значение статистики опыта в trust banner'),
('index.trust.clients.value', '3000+', 'index', 'Значение статистики клиентов в trust banner'),
('index.trust.quality.value', '100%', 'index', 'Значение статистики качества в trust banner'),
('index.trust.support.value', '24/7', 'index', 'Значение статистики поддержки в trust banner')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);

