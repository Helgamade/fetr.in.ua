-- Добавление текстов для секции контактов
-- Тексты для админ-панели /admin/texts

INSERT INTO site_texts (`key`, value, namespace, description) VALUES
('contact.address.pickup', 'Самовивіз за попереднім записом', 'contact', 'Текст под адресой - самовывоз по записи'),
('contact.phone.messengers', 'Viber, Telegram, WhatsApp', 'contact', 'Текст под телефоном - мессенджеры'),
('contact.email.responseTime', 'Відповідаємо протягом 24 годин', 'contact', 'Текст под email - время ответа')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);

