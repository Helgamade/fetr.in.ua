-- Добавление полей для хранения ref городов и отделений Новой Почты в таблицу orders

ALTER TABLE orders 
ADD COLUMN delivery_city_ref VARCHAR(36) NULL COMMENT 'Ref города Новой Почты' AFTER delivery_city,
ADD COLUMN delivery_warehouse_ref VARCHAR(36) NULL COMMENT 'Ref отделения Новой Почты' AFTER delivery_warehouse,
ADD INDEX idx_delivery_city_ref (delivery_city_ref),
ADD INDEX idx_delivery_warehouse_ref (delivery_warehouse_ref);

