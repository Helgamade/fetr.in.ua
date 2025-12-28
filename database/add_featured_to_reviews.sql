-- Добавляем поле для отображения на главной странице
ALTER TABLE reviews 
ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE AFTER is_approved;

-- Добавляем индекс для быстрого поиска featured отзывов
ALTER TABLE reviews
ADD INDEX idx_featured (featured);


