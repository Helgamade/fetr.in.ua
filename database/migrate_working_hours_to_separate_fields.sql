-- Миграция: добавление полей для раздельного хранения графика работы
-- для рабочих дней и выходных (в таблице settings как отдельные записи)

-- Добавляем новые записи в settings для рабочих дней и выходных
INSERT INTO settings (key_name, value, type, description) VALUES
('store_working_hours_weekdays', 'Пн–Пт: 10:00 – 18:00', 'string', 'Графік роботи в робочі дні'),
('store_working_hours_weekend', 'Сб: 10:00 – 14:00', 'string', 'Графік роботи у вихідні дні')
ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description);

