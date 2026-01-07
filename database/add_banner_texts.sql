-- Добавление текстов баннера на главной странице
-- Выполнить: mysql -h idesig02.mysql.tools -u idesig02_fetrinua -p idesig02_fetrinua < database/add_banner_texts.sql

USE idesig02_fetrinua;

INSERT INTO site_texts (`key`, value, namespace, description) VALUES
('banner.text1', '🎁 Безкоштовна доставка від 1500 грн', 'banner', 'Первый текст баннера - бесплатная доставка'),
('banner.text2', '🚀 Відправка щодня до 17:00', 'banner', 'Второй текст баннера - ежедневная отправка'),
('banner.text3', '💝 Подарунок до кожного замовлення', 'banner', 'Третий текст баннера - подарок к каждому заказу')
ON DUPLICATE KEY UPDATE 
  value = VALUES(value),
  description = VALUES(description);

