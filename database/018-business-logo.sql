-- Vemo: logo do negócio nos orçamentos.
-- Faça backup antes. Aplique uma única vez, depois da 017.
-- Apenas cria uma tabela nova; nenhum dado existente é alterado ou removido.
CREATE TABLE IF NOT EXISTS business_logos (
  user_id INT UNSIGNED PRIMARY KEY,
  data_url MEDIUMTEXT NOT NULL,
  updated_at VARCHAR(24) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
