-- Добавить analytics_session_id в social_proof_notifications_log
-- Заменить session_id на analytics_session_id (FK к analytics_sessions.id)

ALTER TABLE social_proof_notifications_log
ADD COLUMN analytics_session_id INT NULL COMMENT 'ID записи из analytics_sessions' AFTER session_id,
ADD INDEX idx_analytics_session_id (analytics_session_id),
ADD FOREIGN KEY (analytics_session_id) REFERENCES analytics_sessions(id) ON DELETE SET NULL;

-- Заполнить analytics_session_id существующими записями
UPDATE social_proof_notifications_log log
INNER JOIN analytics_sessions sess ON log.session_id = sess.session_id
SET log.analytics_session_id = sess.id;

-- После проверки можно удалить старую колонку session_id (но пока оставим для совместимости)
-- ALTER TABLE social_proof_notifications_log DROP COLUMN session_id;
