-- Обновление шаблонов уведомлений для правильного склонения
-- Используются переменные: {people_text} (1 людина / 2 людини / 5 людин) и {verb} (купила / купили)

UPDATE social_proof_notification_types 
SET template = '{people_text} {verb} {product_name}'
WHERE code = 'viewing';

UPDATE social_proof_notification_types 
SET template = '{people_text} {verb} сьогодні {product_name}'
WHERE code = 'purchased_today';

-- Для purchased_local шаблон не меняется
-- Шаблон остается: '{name} ({city}) купила {hours_ago} тому {product_name}'
