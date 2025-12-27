-- Полное удаление всех таблиц базы данных
-- ВНИМАНИЕ: Это удалит все данные!
-- Используйте только если вы уверены!

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS order_item_options;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_product_options;
DROP TABLE IF EXISTS product_features;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_options;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS faqs;
DROP TABLE IF EXISTS gallery_images;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

