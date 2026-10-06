-- Vemo: import once into a NEW, EMPTY MySQL database using phpMyAdmin.
-- No customer records, credentials, or destructive DROP statements are included.
-- InnoDB is required for atomic operations and foreign keys.
SET NAMES utf8mb4;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  password_hash VARCHAR(128) NOT NULL,
  password_salt VARCHAR(32) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  email_verified_at VARCHAR(24),
  business_profile MEDIUMTEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assistant_usage (
  user_id INT UNSIGNED NOT NULL,
  usage_day VARCHAR(10) NOT NULL,
  request_count INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at VARCHAR(24) NOT NULL,
  PRIMARY KEY (user_id, usage_day),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE sessions (
  id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  expires_at VARCHAR(24) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
  id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  window_started_at VARCHAR(24) NOT NULL,
  blocked_until VARCHAR(24),
  updated_at VARCHAR(24) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '',
  address VARCHAR(300) NOT NULL DEFAULT '',
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  created_at VARCHAR(24) NOT NULL,
  request_key VARCHAR(36) NULL,
  INDEX idx_customers_user_id (user_id),
  UNIQUE KEY uq_customers_owner_request (user_id, request_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quotes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  client_snapshot TEXT NULL,
  description TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'Rascunho',
  valid_until VARCHAR(10) NOT NULL,
  deadline VARCHAR(200) NOT NULL DEFAULT 'A combinar',
  payment_method VARCHAR(200) NOT NULL DEFAULT 'Pix',
  discount_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at VARCHAR(24) NOT NULL,
  updated_at VARCHAR(24) NOT NULL,
  sent_at VARCHAR(24),
  approved_at VARCHAR(24),
  archived_at VARCHAR(24) NULL,
  public_token VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  INDEX idx_quotes_customer_id (customer_id),
  INDEX idx_quotes_user_id (user_id),
  INDEX idx_quotes_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quote_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  quote_id INT UNSIGNED NOT NULL,
  kind VARCHAR(16) NOT NULL DEFAULT 'service',
  description VARCHAR(500) NOT NULL,
  quantity DOUBLE NOT NULL DEFAULT 1,
  unit_price_cents BIGINT UNSIGNED NOT NULL,
  INDEX idx_quote_items_quote_id (quote_id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE financial_obligations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  quote_id INT UNSIGNED NULL,
  customer_id INT UNSIGNED NULL,
  type VARCHAR(16) NOT NULL,
  description VARCHAR(300) NOT NULL,
  amount_cents BIGINT UNSIGNED NOT NULL,
  due_date VARCHAR(10) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  installment_group VARCHAR(36) NULL,
  installment_number INT UNSIGNED NOT NULL DEFAULT 1,
  installment_count INT UNSIGNED NOT NULL DEFAULT 1,
  request_key VARCHAR(36) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(24) NOT NULL,
  updated_at VARCHAR(24) NOT NULL,
  INDEX idx_obligations_owner_due (user_id, status, due_date),
  INDEX idx_obligations_quote (user_id, quote_id),
  UNIQUE KEY uq_obligations_owner_request (user_id, request_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  quote_id INT UNSIGNED NULL,
  obligation_id INT UNSIGNED NULL,
  voided_at VARCHAR(24) NULL,
  reversal_of_id INT UNSIGNED NULL,
  request_key VARCHAR(36) NULL,
  receipt_version INT UNSIGNED NOT NULL DEFAULT 1,
  category VARCHAR(50) NOT NULL DEFAULT 'Outros',
  type VARCHAR(16) NOT NULL,
  description VARCHAR(300) NOT NULL,
  amount_cents BIGINT UNSIGNED NOT NULL,
  transaction_date VARCHAR(10) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  INDEX idx_transactions_user_id (user_id),
  INDEX idx_transactions_date (transaction_date),
  INDEX idx_transactions_quote (quote_id),
  INDEX idx_transactions_obligation (user_id, obligation_id),
  UNIQUE KEY uq_transactions_reversal (reversal_of_id),
  UNIQUE KEY uq_transactions_owner_request (user_id, request_key),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
  FOREIGN KEY (obligation_id) REFERENCES financial_obligations(id) ON DELETE SET NULL,
  FOREIGN KEY (reversal_of_id) REFERENCES transactions(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE services (
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

CREATE TABLE appointment_series (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  recurrence VARCHAR(16) NOT NULL,
  interval_count INT UNSIGNED NOT NULL DEFAULT 1,
  starts_on VARCHAR(10) NOT NULL,
  ends_on VARCHAR(10) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  INDEX idx_appointment_series_owner (user_id, starts_on),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NULL,
  service_id INT UNSIGNED NULL,
  employee_id INT UNSIGNED NULL,
  quote_id INT UNSIGNED NULL,
  series_id INT UNSIGNED NULL,
  occurrence_key VARCHAR(80) NULL,
  customer_name VARCHAR(120) NOT NULL,
  title VARCHAR(120) NOT NULL,
  starts_at VARCHAR(16) NOT NULL,
  ends_at VARCHAR(16) NOT NULL,
  duration_minutes INT UNSIGNED NOT NULL,
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  status VARCHAR(24) NOT NULL DEFAULT 'Agendado',
  version INT UNSIGNED NOT NULL DEFAULT 1,
  request_key VARCHAR(36) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  updated_at VARCHAR(24) NOT NULL,
  INDEX idx_appointments_owner_time (user_id, starts_at),
  INDEX idx_appointments_resource_time (user_id, employee_id, starts_at),
  INDEX idx_appointments_quote (user_id, quote_id),
  UNIQUE KEY uq_appointments_owner_request (user_id, request_key),
  UNIQUE KEY uq_appointments_owner_occurrence (user_id, occurrence_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (series_id) REFERENCES appointment_series(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE business_activity (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(32) NOT NULL,
  entity_id INT UNSIGNED NULL,
  title VARCHAR(240) NOT NULL,
  details MEDIUMTEXT NULL,
  reversible BOOLEAN NOT NULL DEFAULT FALSE,
  undone_at VARCHAR(24) NULL,
  created_at VARCHAR(24) NOT NULL,
  INDEX idx_business_activity_owner_time (user_id, created_at),
  INDEX idx_business_activity_entity (user_id, entity_type, entity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE receipt_date_corrections (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  transaction_id INT UNSIGNED NOT NULL,
  version INT UNSIGNED NOT NULL,
  previous_date VARCHAR(10) NOT NULL,
  corrected_date VARCHAR(10) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  UNIQUE KEY uq_receipt_correction_version (transaction_id, version),
  INDEX idx_receipt_correction_owner (user_id, transaction_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workspaces (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_user_id INT UNSIGNED NOT NULL UNIQUE,
  kind VARCHAR(16) NOT NULL DEFAULT 'company',
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

CREATE TABLE workspace_employees (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  job_title VARCHAR(120) NOT NULL DEFAULT '',
  availability TEXT NULL,
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
