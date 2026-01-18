-- Добавление настройки радиуса поиска города для Social Proof
INSERT INTO social_proof_settings (setting_key, setting_value, setting_type, description) 
VALUES ('city_search_radius', '30', 'number', 'Радіус пошуку міста для уведомлень типу "purchased_local" (в кілометрах)')
ON DUPLICATE KEY UPDATE setting_value = '30', setting_type = 'number';
