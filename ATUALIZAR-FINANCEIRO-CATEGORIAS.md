# Financeiro: categorias de despesas

Pacote cumulativo anterior: `vemo-financeiro-categorias.tar.gz`.

A migracao 011 foi aplicada no banco Vemo. **Nao a execute novamente.**
O SQL 011 estava no pacote anterior; ele nao acompanha a atualizacao do grafico,
pois esta etapa nao altera o banco. A migracao 010 ja havia sido aplicada antes.

O formulario de Financas e a Assistente permitem classificar despesas. No
resumo **Saidas do mes**, confira totais por categoria. Despesas antigas
ficaram em "Outros"; receitas nao exigem categoria. Categorias sao apenas uma
organizacao simples, nao um plano contabil nem previsao bancaria.

Para a versao mais recente, envie `vemo-financeiro-grafico.tar.gz` conforme
`ATUALIZAR-FINANCEIRO-GRAFICO.md`.
