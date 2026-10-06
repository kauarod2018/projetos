-- Vemo: audit trail, planned receivables/payables, assistant usage and appointment series.
-- Apply once, after migrations 010 and 011, to the existing Vemo database.
-- Back up the database before importing this migration.

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

ALTER TABLE transactions
  DROP INDEX uq_transactions_quote,
  ADD INDEX idx_transactions_quote (quote_id),
  ADD COLUMN obligation_id INT UNSIGNED NULL AFTER quote_id,
  ADD COLUMN voided_at VARCHAR(24) NULL,
  ADD COLUMN reversal_of_id INT UNSIGNED NULL,
  ADD INDEX idx_transactions_obligation (user_id, obligation_id),
  ADD UNIQUE KEY uq_transactions_reversal (reversal_of_id),
  ADD CONSTRAINT fk_transactions_obligation FOREIGN KEY (obligation_id) REFERENCES financial_obligations(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_transactions_reversal FOREIGN KEY (reversal_of_id) REFERENCES transactions(id) ON DELETE SET NULL;

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

ALTER TABLE appointments
  ADD COLUMN series_id INT UNSIGNED NULL AFTER service_id,
  ADD COLUMN occurrence_key VARCHAR(80) NULL,
  ADD UNIQUE KEY uq_appointments_owner_occurrence (user_id, occurrence_key),
  ADD CONSTRAINT fk_appointments_series FOREIGN KEY (series_id) REFERENCES appointment_series(id) ON DELETE SET NULL;

CREATE TABLE assistant_usage (
  user_id INT UNSIGNED NOT NULL,
  usage_day VARCHAR(10) NOT NULL,
  request_count INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at VARCHAR(24) NOT NULL,
  PRIMARY KEY (user_id, usage_day),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
