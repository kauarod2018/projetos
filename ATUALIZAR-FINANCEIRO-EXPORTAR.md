# Financeiro: exportar movimentacoes

Pacote cumulativo: `vemo-financeiro-exportar.tar.gz`.

## Publicar

Nao ha SQL novo nesta atualizacao. Ela usa as movimentacoes ja registradas e as
categorias disponiveis desde a migracao 011. Publique o pacote na mesma aplicacao
Next.js da Hostinger, mantendo as variaveis de ambiente existentes.

## Usar

Na pagina **Financas**, escolha o mes e selecione **Exportar CSV**. O arquivo
contem somente entradas e saidas registradas daquele mes, incluindo categoria
das despesas e eventual numero do orcamento vinculado. Valores previstos a
receber nao sao exportados como pagamentos.

## Verificacao local

Compilacao de producao executada. Nao houve acesso ao banco real, teste de
importacao em planilha nem publicacao automatica na Hostinger.
