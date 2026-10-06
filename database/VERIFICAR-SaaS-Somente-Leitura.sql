-- Vemo: metadata-only diagnostic for the database selected in phpMyAdmin.
-- This file does not create, change or delete tables, accounts or records.
-- ENCONTRADO confirms an object exists, not that a migration completed.
-- If no database is selected, stop and select the database used by Vemo.

SELECT
  CASE WHEN DATABASE() IS NULL THEN 'SELECIONE_O_BANCO_DO_VEMO'
       ELSE 'BANCO_SELECIONADO_CONFIRME_QUE_E_O_DO_VEMO' END AS orientacao;

SELECT
  expected.etapa,
  expected.tabela,
  expected.item,
  CASE
    WHEN DATABASE() IS NULL THEN 'BANCO_NAO_SELECIONADO'
    WHEN expected.tipo = 'tabela' AND actual_table.TABLE_NAME IS NOT NULL THEN 'ENCONTRADO'
    WHEN expected.tipo = 'coluna' AND actual_column.COLUMN_NAME IS NOT NULL THEN 'ENCONTRADO'
    ELSE 'NAO_ENCONTRADO'
  END AS resultado
FROM (
  SELECT '000-base' AS etapa, 'users' AS tabela, 'tabela' AS tipo, '(tabela)' AS item
  UNION ALL SELECT '000-base', 'sessions', 'tabela', '(tabela)'
  UNION ALL SELECT '000-base', 'customers', 'tabela', '(tabela)'
  UNION ALL SELECT '000-base', 'quotes', 'tabela', '(tabela)'
  UNION ALL SELECT '000-base', 'transactions', 'tabela', '(tabela)'
  UNION ALL SELECT '000-base', 'appointments', 'tabela', '(tabela)'
  UNION ALL SELECT '002', 'users', 'coluna', 'email_verified_at'
  UNION ALL SELECT '002', 'account_tokens', 'tabela', '(tabela)'
  UNION ALL SELECT '003', 'quotes', 'coluna', 'client_snapshot'
  UNION ALL SELECT '005', 'services', 'tabela', '(tabela)'
  UNION ALL SELECT '012', 'business_activity', 'tabela', '(tabela)'
  UNION ALL SELECT '012', 'financial_obligations', 'tabela', '(tabela)'
  UNION ALL SELECT '012', 'appointment_series', 'tabela', '(tabela)'
  UNION ALL SELECT '012', 'assistant_usage', 'tabela', '(tabela)'
  UNION ALL SELECT '012', 'transactions', 'coluna', 'obligation_id'
  UNION ALL SELECT '012', 'transactions', 'coluna', 'voided_at'
  UNION ALL SELECT '012', 'transactions', 'coluna', 'reversal_of_id'
  UNION ALL SELECT '012', 'appointments', 'coluna', 'series_id'
  UNION ALL SELECT '012', 'appointments', 'coluna', 'occurrence_key'
  UNION ALL SELECT '013', 'workspaces', 'tabela', '(tabela)'
  UNION ALL SELECT '013', 'workspace_members', 'tabela', '(tabela)'
  UNION ALL SELECT '013', 'workspace_subscriptions', 'tabela', '(tabela)'
  UNION ALL SELECT '013', 'workspace_selections', 'tabela', '(tabela)'
  UNION ALL SELECT '013', 'workspace_invites', 'tabela', '(tabela)'
  UNION ALL SELECT '014', 'workspace_billing', 'tabela', '(tabela)'
  UNION ALL SELECT '014', 'billing_events', 'tabela', '(tabela)'
  UNION ALL SELECT '015', 'workspaces', 'coluna', 'kind'
  UNION ALL SELECT '015', 'workspace_employees', 'tabela', '(tabela)'
  UNION ALL SELECT '015', 'employee_assignments', 'tabela', '(tabela)'
  UNION ALL SELECT '016', 'appointments', 'coluna', 'employee_id'
  UNION ALL SELECT '016', 'appointments', 'coluna', 'quote_id'
  UNION ALL SELECT '016', 'workspace_employees', 'coluna', 'availability'
  UNION ALL SELECT '016', 'employee_absences', 'tabela', '(tabela)'
  UNION ALL SELECT '016', 'service_reports', 'tabela', '(tabela)'
  UNION ALL SELECT '017', 'quotes', 'coluna', 'archived_at'
) AS expected
LEFT JOIN information_schema.TABLES AS actual_table
  ON actual_table.TABLE_SCHEMA = DATABASE()
  AND actual_table.TABLE_NAME = expected.tabela
  AND actual_table.TABLE_TYPE = 'BASE TABLE'
LEFT JOIN information_schema.COLUMNS AS actual_column
  ON actual_column.TABLE_SCHEMA = DATABASE()
  AND actual_column.TABLE_NAME = expected.tabela
  AND actual_column.COLUMN_NAME = expected.item
ORDER BY expected.etapa, expected.tabela, expected.item;
