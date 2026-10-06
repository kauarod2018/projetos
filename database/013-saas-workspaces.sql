-- Apply once after 012, with a verified backup and maintenance window.
-- Additive migration: existing business rows and account IDs are unchanged.
SET NAMES utf8mb4;

CREATE TABLE workspaces (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_user_id INT UNSIGNED NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workspace_members (
  workspace_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role VARCHAR(16) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  UNIQUE KEY uq_workspace_member (workspace_id, user_id),
  INDEX idx_workspace_member_user (user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workspace_subscriptions (
  workspace_id INT UNSIGNED NOT NULL PRIMARY KEY,
  status VARCHAR(16) NOT NULL,
  trial_starts_at VARCHAR(24),
  trial_ends_at VARCHAR(24),
  paid_until VARCHAR(24),
  updated_at VARCHAR(24) NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workspace_selections (
  session_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workspace_invites (
  id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  email VARCHAR(254) NOT NULL,
  role VARCHAR(16) NOT NULL,
  invited_by INT UNSIGNED NOT NULL,
  expires_at VARCHAR(24) NOT NULL,
  accepted_at VARCHAR(24),
  revoked_at VARCHAR(24),
  created_at VARCHAR(24) NOT NULL,
  INDEX idx_workspace_invites (workspace_id, email),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

START TRANSACTION;
INSERT INTO workspaces (owner_user_id, name, created_at)
SELECT id, name, created_at FROM users;
INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
SELECT id, owner_user_id, 'owner', created_at FROM workspaces;
-- Existing accounts are grandfathered. Never start a new trial at login.
INSERT INTO workspace_subscriptions (workspace_id, status, updated_at)
SELECT id, 'legacy', created_at FROM workspaces;
COMMIT;
