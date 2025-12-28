-- Добавление переводов для секции отзывов
-- Включая кнопку добавления и статистику

INSERT INTO site_texts (`key`, `value`, `namespace`, `description`) VALUES
('reviews.add_button', '+ Додати відгук', 'reviews', 'Текст кнопки добавления отзыва'),
('reviews.stats.average_rating', 'Середня оцінка', 'reviews', 'Подпись для средней оценки'),
('reviews.stats.reviews_count', 'Відгуків', 'reviews', 'Подпись для количества отзывов'),
('reviews.stats.satisfied_clients', 'Задоволених клієнтів', 'reviews', 'Подпись для процента довольных клиентов')
ON DUPLICATE KEY UPDATE 
  `value` = VALUES(`value`),
  `description` = VALUES(`description`);

