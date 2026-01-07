-- Таблица шаблонов email уведомлений
CREATE TABLE IF NOT EXISTS email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Вставляем дефолтные шаблоны
INSERT INTO email_templates (event_type, subject, body_html, body_text, description, is_active) VALUES
('order_created_admin', 'Нове замовлення #{{orderNumber}}', 
'<h2>Нове замовлення #{{orderNumber}}</h2>
<p><strong>Клієнт:</strong> {{customerName}}<br>
<strong>Телефон:</strong> {{customerPhone}}<br>
{{#if customerEmail}}<strong>Email:</strong> {{customerEmail}}<br>{{/if}}
</p>
<p><strong>Сума замовлення:</strong> {{total}} ₴</p>
<p><strong>Статус:</strong> {{status}}</p>
<p><strong>Спосіб доставки:</strong> {{deliveryMethod}}<br>
{{#if deliveryCity}}<strong>Місто:</strong> {{deliveryCity}}<br>{{/if}}
{{#if deliveryWarehouse}}<strong>Відділення:</strong> {{deliveryWarehouse}}<br>{{/if}}
</p>
<p><strong>Спосіб оплати:</strong> {{paymentMethod}}</p>
<p><a href="{{orderLink}}">Переглянути замовлення</a></p>',
'Нове замовлення #{{orderNumber}}\n\nКлієнт: {{customerName}}\nТелефон: {{customerPhone}}\n{{#if customerEmail}}Email: {{customerEmail}}\n{{/if}}\n\nСума замовлення: {{total}} ₴\nСтатус: {{status}}\n\nСпосіб доставки: {{deliveryMethod}}\n{{#if deliveryCity}}Місто: {{deliveryCity}}\n{{/if}}{{#if deliveryWarehouse}}Відділення: {{deliveryWarehouse}}\n{{/if}}\n\nСпосіб оплати: {{paymentMethod}}\n\nПереглянути: {{orderLink}}',
'Email для адміністратора про нове замовлення', TRUE),

('order_created_customer', 'Ваше замовлення #{{orderNumber}} прийнято', 
'<h2>Дякуємо за ваше замовлення!</h2>
<p>Ваше замовлення #{{orderNumber}} успішно прийнято.</p>
<p><strong>Сума замовлення:</strong> {{total}} ₴</p>
<p><strong>Статус:</strong> {{status}}</p>
<p>Ми зв\'яжемося з вами найближчим часом для підтвердження замовлення.</p>
<p><a href="{{trackingLink}}">Відстежити замовлення</a></p>',
'Дякуємо за ваше замовлення!\n\nВаше замовлення #{{orderNumber}} успішно прийнято.\n\nСума замовлення: {{total}} ₴\nСтатус: {{status}}\n\nМи зв\'яжемося з вами найближчим часом.\n\nВідстежити: {{trackingLink}}',
'Email для клієнта про прийняття замовлення', TRUE),

('order_paid_admin', 'Замовлення #{{orderNumber}} оплачено', 
'<h2>Замовлення #{{orderNumber}} оплачено</h2>
<p><strong>Клієнт:</strong> {{customerName}}<br>
<strong>Сума:</strong> {{total}} ₴</p>
<p><a href="{{orderLink}}">Переглянути замовлення</a></p>',
'Замовлення #{{orderNumber}} оплачено\n\nКлієнт: {{customerName}}\nСума: {{total}} ₴\n\nПереглянути: {{orderLink}}',
'Email для адміністратора про оплату замовлення', TRUE),

('order_paid_customer', 'Ваше замовлення #{{orderNumber}} оплачено', 
'<h2>Оплата підтверджена</h2>
<p>Ваше замовлення #{{orderNumber}} успішно оплачено.</p>
<p><strong>Сума:</strong> {{total}} ₴</p>
<p>Ми почнемо обробку вашого замовлення найближчим часом.</p>
<p><a href="{{trackingLink}}">Відстежити замовлення</a></p>',
'Оплата підтверджена\n\nВаше замовлення #{{orderNumber}} успішно оплачено.\n\nСума: {{total}} ₴\n\nМи почнемо обробку вашого замовлення найближчим часом.\n\nВідстежити: {{trackingLink}}',
'Email для клієнта про оплату замовлення', TRUE),

('order_status_changed', 'Статус вашого замовлення #{{orderNumber}} змінено', 
'<h2>Статус замовлення оновлено</h2>
<p>Статус вашого замовлення #{{orderNumber}} змінено на: <strong>{{status}}</strong></p>
{{#if statusComment}}<p>{{statusComment}}</p>{{/if}}
<p><a href="{{trackingLink}}">Відстежити замовлення</a></p>',
'Статус замовлення оновлено\n\nСтатус вашого замовлення #{{orderNumber}} змінено на: {{status}}\n\n{{#if statusComment}}{{statusComment}}\n{{/if}}Відстежити: {{trackingLink}}',
'Email для клієнта про зміну статусу замовлення', TRUE),

('review_created_admin', 'Новий відгук від {{reviewerName}}', 
'<h2>Новий відгук</h2>
<p><strong>Автор:</strong> {{reviewerName}}<br>
<strong>Рейтинг:</strong> {{rating}}/5<br>
<strong>Текст:</strong> {{reviewText}}</p>
<p><a href="{{reviewLink}}">Переглянути відгук</a></p>',
'Новий відгук\n\nАвтор: {{reviewerName}}\nРейтинг: {{rating}}/5\n\nТекст: {{reviewText}}\n\nПереглянути: {{reviewLink}}',
'Email для адміністратора про новий відгук', TRUE),

('review_approved', 'Ваш відгук опубліковано', 
'<h2>Дякуємо за ваш відгук!</h2>
<p>Ваш відгук успішно опубліковано на нашому сайті.</p>
<p><a href="{{reviewLink}}">Переглянути відгук</a></p>',
'Дякуємо за ваш відгук!\n\nВаш відгук успішно опубліковано на нашому сайті.\n\nПереглянути: {{reviewLink}}',
'Email для клієнта про публікацію відгуку', TRUE)

ON DUPLICATE KEY UPDATE 
  subject=VALUES(subject), 
  body_html=VALUES(body_html), 
  body_text=VALUES(body_text),
  description=VALUES(description);

-- Добавляем настройки для SMTP (если их еще нет)
INSERT INTO settings (key_name, value, type, description) VALUES
('smtp_host', '', 'string', 'SMTP хост для відправки email'),
('smtp_port', '587', 'string', 'SMTP порт'),
('smtp_secure', 'false', 'boolean', 'Використовувати SSL/TLS'),
('smtp_user', '', 'string', 'SMTP користувач'),
('smtp_password', '', 'string', 'SMTP пароль'),
('smtp_from_email', '', 'string', 'Email відправника'),
('smtp_from_name', 'Fetr.in.ua', 'string', 'Ім\'я відправника')
ON DUPLICATE KEY UPDATE description=VALUES(description);

