-- Apply once AFTER 014, in maintenance with a verified backup.
-- Preserve existing modes as company, memberships and business records.
SET NAMES utf8mb4;
ALTER TABLE workspaces ADD COLUMN kind VARCHAR(16) NOT NULL DEFAULT 'company';
CREATE TABLE workspace_employees (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  job_title VARCHAR(120) NOT NULL DEFAULT '',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(24) NOT NULL,
  updated_at VARCHAR(24) NOT NULL,
  UNIQUE KEY uq_employee_email (workspace_id, email),
  UNIQUE KEY uq_employee_user (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE employee_assignments (
  appointment_id INT UNSIGNED NOT NULL PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  employee_id INT UNSIGNED NOT NULL,
  instructions VARCHAR(1000) NOT NULL DEFAULT '',
  assigned_by INT UNSIGNED NOT NULL,
  updated_at VARCHAR(24) NOT NULL,
  INDEX idx_employee_assignments (workspace_id, employee_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES workspace_employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
