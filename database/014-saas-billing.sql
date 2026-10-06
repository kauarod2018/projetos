-- Run once AFTER 013, in a maintenance window with a verified backup.
-- No business records, trial dates or existing access are changed.
SET NAMES utf8mb4;
CREATE TABLE workspace_billing (
  workspace_id INT UNSIGNED NOT NULL PRIMARY KEY,
  customer_id VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin UNIQUE,
  subscription_id VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin UNIQUE,
  checkout_id VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin UNIQUE,
  checkout_generation INT UNSIGNED NOT NULL DEFAULT 0,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  provider_status VARCHAR(32),
  updated_at VARCHAR(24) NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE billing_events (
  id VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  type VARCHAR(100) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
