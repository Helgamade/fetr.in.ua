-- Добавление поля description в таблицу instagram_posts
ALTER TABLE instagram_posts
ADD COLUMN description TEXT NULL AFTER image_url;
