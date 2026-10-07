-- Vemo: atualiza o banco da Hostinger com as migrações 013 a 017, de uma vez.
-- Feito para o estado do banco conferido em 07/10/2026 (diagnóstico completo).
--
-- ANTES: faça backup no phpMyAdmin (Exportar > Rápido > SQL > Executar).
-- Selecione o banco do Vemo, cole tudo na aba SQL e clique em Executar.
--
-- Seguro para rodar de novo: cada passo só cria o que ainda não existe.
-- Não apaga nem altera dados existentes; apenas cria tabelas e colunas novas
-- e cria uma "empresa" para cada conta existente (marcada como legado, sem
-- teste gratuito novo e sem cobrança). O modo SaaS continua desligado.
--
-- As tabelas novas não usam chave estrangeira apontando para as tabelas antigas
-- (users, sessions, appointments), para evitar o erro 150 visto na Hostinger.
-- O próprio sistema já garante a separação dos dados de cada conta.

SET NAMES utf8mb4;

-- 013: empresas, membros, assinatura, empresa ativa por sessão e convites
CREATE TABLE IF NOT EXISTS workspaces (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_user_id INT UNSIGNED NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  created_at VARCHAR(24) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role VARCHAR(16) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  UNIQUE KEY uq_workspace_member (workspace_id, user_id),
  INDEX idx_workspace_member_user (user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  workspace_id INT UNSIGNED NOT NULL PRIMARY KEY,
  status VARCHAR(16) NOT NULL,
  trial_starts_at VARCHAR(24),
  trial_ends_at VARCHAR(24),
  paid_until VARCHAR(24),
  updated_at VARCHAR(24) NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_selections (
  session_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_invites (
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
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Uma empresa por conta existente (só para quem ainda não tem), como dono e com acesso legado.
INSERT INTO workspaces (owner_user_id, name, created_at)
SELECT u.id, u.name, u.created_at FROM users u
WHERE NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.owner_user_id = u.id);
INSERT IGNORE INTO workspace_members (workspace_id, user_id, role, created_at)
SELECT w.id, w.owner_user_id, 'owner', w.created_at FROM workspaces w;
INSERT IGNORE INTO workspace_subscriptions (workspace_id, status, updated_at)
SELECT w.id, 'legacy', w.created_at FROM workspaces w;

-- 014: dados de cobrança (continua desligada até configurar e validar)
CREATE TABLE IF NOT EXISTS workspace_billing (
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

CREATE TABLE IF NOT EXISTS billing_events (
  id VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  type VARCHAR(100) NOT NULL,
  created_at VARCHAR(24) NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 015: tipo de conta e funcionários
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS kind VARCHAR(16) NOT NULL DEFAULT 'company';

CREATE TABLE IF NOT EXISTS workspace_employees (
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
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_assignments (
  appointment_id INT UNSIGNED NOT NULL PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  employee_id INT UNSIGNED NOT NULL,
  instructions VARCHAR(1000) NOT NULL DEFAULT '',
  assigned_by INT UNSIGNED NOT NULL,
  updated_at VARCHAR(24) NOT NULL,
  INDEX idx_employee_assignments (workspace_id, employee_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES workspace_employees(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 016: responsável e orçamento na agenda, disponibilidade, ausências e relatórios
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS employee_id INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS quote_id INT UNSIGNED NULL,
  ADD INDEX IF NOT EXISTS idx_appointments_resource_time (user_id, employee_id, starts_at),
  ADD INDEX IF NOT EXISTS idx_appointments_quote (user_id, quote_id);
UPDATE appointments a JOIN employee_assignments e ON e.appointment_id = a.id
  JOIN workspaces w ON w.id = e.workspace_id AND w.owner_user_id = a.user_id
  SET a.employee_id = e.employee_id
  WHERE a.employee_id IS NULL;
ALTER TABLE workspace_employees ADD COLUMN IF NOT EXISTS availability TEXT NULL;

CREATE TABLE IF NOT EXISTS employee_absences (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  employee_id INT UNSIGNED NOT NULL,
  starts_at VARCHAR(16) NOT NULL,
  ends_at VARCHAR(16) NOT NULL,
  reason VARCHAR(120) NOT NULL DEFAULT '',
  created_at VARCHAR(24) NOT NULL,
  INDEX idx_absences_resource (workspace_id, employee_id, starts_at),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES workspace_employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_reports (
  appointment_id INT UNSIGNED PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  checklist TEXT NOT NULL,
  photos MEDIUMTEXT NOT NULL,
  summary VARCHAR(2000) NOT NULL DEFAULT '',
  acknowledged_by VARCHAR(120) NULL,
  acknowledged_at VARCHAR(24) NULL,
  next_visit_on VARCHAR(10) NULL,
  public_token_hash VARCHAR(64) UNIQUE NULL,
  public_expires_at VARCHAR(24) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  updated_at VARCHAR(24) NOT NULL,
  INDEX idx_reports_owner_return (user_id, next_visit_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 017: arquivamento de orçamentos
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_at VARCHAR(24) NULL;

-- Conferência: deve mostrar uma linha por conta, com empresa e acesso legado.
SELECT COUNT(*) AS contas, (SELECT COUNT(*) FROM workspaces) AS empresas, (SELECT COUNT(*) FROM workspace_subscriptions) AS assinaturas FROM users;
