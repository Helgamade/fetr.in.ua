-- Migration 010: Increase session_token and refresh_token length
-- JWT tokens can be longer than 255 characters, so we increase to 1000

-- Изменяем размер поля session_token с VARCHAR(255) на VARCHAR(1000)
ALTER TABLE user_sessions 
MODIFY COLUMN session_token VARCHAR(1000) NOT NULL;

-- Изменяем размер поля refresh_token с VARCHAR(255) на VARCHAR(1000)
ALTER TABLE user_sessions 
MODIFY COLUMN refresh_token VARCHAR(1000) NULL;

-- Примечание: UNIQUE индекс автоматически сохранится, так как мы просто увеличиваем размер поля