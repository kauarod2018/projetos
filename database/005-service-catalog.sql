-- Optional additive migration for databases that do not have services yet.
-- Do not run on a new database already installed with schema.sql.
CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(300) NOT NULL DEFAULT '',
  price_cents BIGINT UNSIGNED NOT NULL,
  duration_minutes INT UNSIGNED NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  request_key VARCHAR(36) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  updated_at VARCHAR(24) NOT NULL,
  INDEX idx_services_owner_archived (user_id, archived),
  UNIQUE KEY uq_services_owner_request (user_id, request_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
