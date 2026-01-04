-- Добавление текстов секции Contact
-- Выполнить этот файл на сервере через phpMyAdmin или MySQL CLI

INSERT INTO site_texts (`key`, value, namespace, description) VALUES
('contact.badge', 'Контакти', 'contact', 'Бейдж в секції контактів'),
('contact.title', 'Зв''яжіться з нами', 'contact', 'Заголовок секції контактів'),
('contact.subtitle', 'Ми завжди раді відповісти на ваші запитання', 'contact', 'Підзаголовок секції контактів'),
('contact.address.pickup', 'Самовивіз за попереднім записом', 'contact', 'Текст под адресой - самовывоз по записи'),
('contact.phone.messengers', 'Viber, Telegram, WhatsApp', 'contact', 'Текст под телефоном - мессенджеры'),
('contact.email.responseTime', 'Відповідаємо протягом 24 годин', 'contact', 'Текст под email - время ответа')
ON DUPLICATE KEY UPDATE 
  value = VALUES(value), 
  description = VALUES(description);

