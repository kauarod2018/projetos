-- Back up first. Apply after 015, before deploying this release. Run once.
ALTER TABLE appointments ADD COLUMN employee_id INT UNSIGNED NULL, ADD COLUMN quote_id INT UNSIGNED NULL,
  ADD INDEX idx_appointments_resource_time (user_id, employee_id, starts_at),
  ADD INDEX idx_appointments_quote (user_id, quote_id);
UPDATE appointments a JOIN employee_assignments e ON e.appointment_id = a.id
  JOIN workspaces w ON w.id = e.workspace_id AND w.owner_user_id = a.user_id
  SET a.employee_id = e.employee_id;
ALTER TABLE workspace_employees ADD COLUMN availability TEXT NULL;
CREATE TABLE employee_absences (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, workspace_id INT UNSIGNED NOT NULL,
  employee_id INT UNSIGNED NOT NULL, starts_at VARCHAR(16) NOT NULL, ends_at VARCHAR(16) NOT NULL,
  reason VARCHAR(120) NOT NULL DEFAULT '', created_at VARCHAR(24) NOT NULL,
  INDEX idx_absences_resource (workspace_id, employee_id, starts_at),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES workspace_employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE service_reports (
  appointment_id INT UNSIGNED PRIMARY KEY, user_id INT UNSIGNED NOT NULL,
  checklist TEXT NOT NULL, photos MEDIUMTEXT NOT NULL, summary VARCHAR(2000) NOT NULL DEFAULT '',
  acknowledged_by VARCHAR(120) NULL, acknowledged_at VARCHAR(24) NULL, next_visit_on VARCHAR(10) NULL,
  public_token_hash VARCHAR(64) UNIQUE NULL, public_expires_at VARCHAR(24) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1, updated_at VARCHAR(24) NOT NULL,
  INDEX idx_reports_owner_return (user_id, next_visit_on),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
