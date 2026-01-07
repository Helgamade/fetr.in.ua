-- Обновление настроек SMTP для хостинга
UPDATE settings SET value = 'mail.adm.tools' WHERE key_name = 'smtp_host';
UPDATE settings SET value = '465' WHERE key_name = 'smtp_port';
UPDATE settings SET value = 'true' WHERE key_name = 'smtp_secure';
UPDATE settings SET value = 'noreply@fetr.in.ua' WHERE key_name = 'smtp_user';
UPDATE settings SET value = 'noreply@fetr.in.ua' WHERE key_name = 'smtp_from_email';
UPDATE settings SET value = 'Fetr.in.ua' WHERE key_name = 'smtp_from_name';

-- Если настроек еще нет, создаем их
INSERT INTO settings (key_name, value, type, description) VALUES
('smtp_host', 'mail.adm.tools', 'string', 'SMTP хост для відправки email'),
('smtp_port', '465', 'string', 'SMTP порт'),
('smtp_secure', 'true', 'boolean', 'Використовувати SSL/TLS'),
('smtp_user', 'noreply@fetr.in.ua', 'string', 'SMTP користувач'),
('smtp_password', '', 'string', 'SMTP пароль'),
('smtp_from_email', 'noreply@fetr.in.ua', 'string', 'Email відправника'),
('smtp_from_name', 'Fetr.in.ua', 'string', 'Ім\'я відправника')
ON DUPLICATE KEY UPDATE value=VALUES(value), type=VALUES(type);

