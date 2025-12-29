-- Таблицы для справочников Новой Почты

-- Таблица городов Новой Почты
CREATE TABLE IF NOT EXISTS nova_poshta_cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(36) NOT NULL UNIQUE COMMENT 'Уникальный идентификатор города из API НП',
  description_ua VARCHAR(255) NOT NULL COMMENT 'Название города на украинском',
  description_ru VARCHAR(255) NULL COMMENT 'Название города на русском',
  area_ref VARCHAR(36) NULL COMMENT 'Ссылка на область',
  area_description_ua VARCHAR(255) NULL COMMENT 'Название области на украинском',
  area_description_ru VARCHAR(255) NULL COMMENT 'Название области на русском',
  settlement_type_ref VARCHAR(36) NULL COMMENT 'Тип населенного пункта (ref)',
  settlement_type_description_ua VARCHAR(100) NULL COMMENT 'Тип населенного пункта на украинском',
  settlement_type_description_ru VARCHAR(100) NULL COMMENT 'Тип населенного пункта на русском',
  is_popular BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Популярный город (для быстрого выбора)',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Порядок сортировки для популярных городов',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ref (ref),
  INDEX idx_description_ua (description_ua),
  INDEX idx_area_ref (area_ref),
  INDEX idx_is_popular (is_popular),
  FULLTEXT KEY ft_description_ua (description_ua)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица отделений и почтоматов Новой Почты
CREATE TABLE IF NOT EXISTS nova_poshta_warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(36) NOT NULL UNIQUE COMMENT 'Уникальный идентификатор отделения из API НП',
  site_key INT NULL COMMENT 'Номер отделения',
  description_ua VARCHAR(500) NOT NULL COMMENT 'Описание отделения на украинском',
  description_ru VARCHAR(500) NULL COMMENT 'Описание отделения на русском',
  short_address_ua VARCHAR(255) NULL COMMENT 'Короткий адрес на украинском',
  short_address_ru VARCHAR(255) NULL COMMENT 'Короткий адрес на русском',
  city_ref VARCHAR(36) NOT NULL COMMENT 'Ссылка на город',
  city_description_ua VARCHAR(255) NOT NULL COMMENT 'Название города на украинском',
  city_description_ru VARCHAR(255) NULL COMMENT 'Название города на русском',
  type_of_warehouse VARCHAR(50) NOT NULL COMMENT 'Тип: PostOffice (отделение) или Postomat (почтомат)',
  number VARCHAR(20) NULL COMMENT 'Номер отделения для сортировки',
  phone VARCHAR(50) NULL COMMENT 'Телефон отделения',
  max_weight_allowed DECIMAL(10, 2) NULL COMMENT 'Максимальный вес',
  longitude DECIMAL(10, 7) NULL COMMENT 'Долгота',
  latitude DECIMAL(10, 7) NULL COMMENT 'Широта',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ref (ref),
  INDEX idx_city_ref (city_ref),
  INDEX idx_type_of_warehouse (type_of_warehouse),
  INDEX idx_number (number),
  INDEX idx_site_key (site_key),
  FULLTEXT KEY ft_description_ua (description_ua),
  FOREIGN KEY (city_ref) REFERENCES nova_poshta_cities(ref) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

