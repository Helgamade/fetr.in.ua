-- Очистка всех tracking_token в таблице orders
-- Выполнить: mysql -u idesig02 -p idesig02_fetrinua < database/clear_tracking_tokens.sql

USE idesig02_fetrinua;

UPDATE orders SET tracking_token = NULL WHERE tracking_token IS NOT NULL;

