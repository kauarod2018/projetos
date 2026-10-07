-- Vemo: logo do negócio nos orçamentos.
-- Faça backup antes. Aplique uma única vez.
-- Apenas cria uma tabela nova; nenhum dado existente é alterado ou removido.
-- Sem chave estrangeira de propósito: funciona mesmo que a tabela users da
-- instalação tenha tipo de coluna ou motor diferente do schema.sql atual.
CREATE TABLE IF NOT EXISTS business_logos (
  user_id INT UNSIGNED NOT NULL PRIMARY KEY,
  data_url MEDIUMTEXT NOT NULL,
  updated_at VARCHAR(24) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
