-- Создание структуры для галерей
-- Сначала создаем таблицу galleries
CREATE TABLE IF NOT EXISTS galleries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Обновляем таблицу gallery_images - добавляем gallery_id и description
ALTER TABLE gallery_images 
ADD COLUMN gallery_id INT NULL AFTER id,
ADD COLUMN description TEXT NULL AFTER title;

-- Добавляем внешний ключ
ALTER TABLE gallery_images
ADD CONSTRAINT fk_gallery_images_gallery_id 
FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE;

-- Добавляем индекс для gallery_id
ALTER TABLE gallery_images
ADD INDEX idx_gallery_id (gallery_id);


