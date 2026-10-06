-- Existing Vemo installation only. Back up the database first. Import ONCE.
-- Existing users remain unverified; no accounts or business data are removed.
ALTER TABLE users ADD COLUMN email_verified_at VARCHAR(24) NULL;

CREATE TABLE account_tokens (
  id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  purpose VARCHAR(16) NOT NULL,
  email VARCHAR(254) NOT NULL,
  expires_at VARCHAR(24) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  INDEX idx_account_tokens_user (user_id),
  INDEX idx_account_tokens_expiry (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
