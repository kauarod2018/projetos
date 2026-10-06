# Correcao da data de recebimento

Pacote cumulativo: `vemo-correcao-data.tar.gz`.
Mantem Next.js 16.3.6 e as entregas anteriores desta mesma base.

## Instalar

1. Guarde backup do banco e da implantacao atual.
2. Na base onde as etapas 005, 006 e 007 ja foram aplicadas e testadas,
   importe SOMENTE `database/008-receipt-date-corrections.sql`, uma vez.
   Nao repita os SQLs anteriores e nao importe schema.sql no banco existente.
3. Se a importacao apresentar erro, pare e envie a mensagem. Nao exclua
   tabelas/colunas nem desative a verificacao de chaves para tentar novamente.
4. Envie o pacote na mesma aplicacao Next.js da Hostinger. Preserve as
   variaveis, raiz `/`, `npm run build` e `npm start`.

## Funcionalidade

No orcamento que ja tem recebimento vinculado, escolha Corrigir data.
Informe a data correta, o motivo e confirme. O valor e o status Pago nao mudam.
O registro sera contado na data corrigida em Financas, Hoje e no historico
do cliente. A correcao tambem vale para uma entrada manual que tenha sido
vinculada ao orcamento.

A data anterior, a nova data, o motivo e o momento da alteracao ficam salvos.
O painel mostra as ultimas 20 correcoes; registros mais antigos permanecem
no banco. O motivo fica privado na conta, nao aparece no link publico ou PDF.
Nao e uma verificacao bancaria, estorno, cancelamento ou devolucao de dinheiro.
Parcelas e correcao de valores ainda nao fazem parte desta entrega.

Reenviar a mesma correcao apos falha de rede nao duplica o historico. Uma aba
com versao antiga nao pode sobrescrever alteracoes posteriores; ela pede
atualizacao. A alteracao da data e o historico sao gravados juntos.

## Testar com dados de teste na Hostinger

1. Abra um recebimento e mude a data para outro mes, informando o motivo.
2. Confira a data, o historico e a permanencia do valor/status Pago.
3. Confira Financas nos dois meses: a entrada sai do mes antigo e aparece
   uma vez no mes correto. Confira tambem Hoje e o historico do cliente.
4. Abra o formulario em duas abas; corrija em uma e tente confirmar outra
   data na segunda. Deve pedir atualizacao, sem sobrescrever a primeira.
5. Confira que outra conta nao consegue consultar ou corrigir o recebimento.
6. Teste no celular e confirme que Cancelar nao altera os registros.

## Verificacao local e limites

Aplicadas skills de formularios, acessibilidade, React, seguranca e testes.
54 testes automatizados passaram, alem da compilacao e testes de acesso do
servidor. Playwright conferiu formulario, erro/reenvio, conflito entre abas,
historico e mes financeiro em telas de 320, 390 e 1440 pixels, com respostas
de API simuladas. Browser plugin indisponivel; usado Playwright local.
Testes das rotas usam banco simulado: propriedade, origem, datas invalidas,
repeticao, versoes antigas, preservacao de valores e rollback.
O MySQL real e a concorrencia real precisam dos testes na hospedagem.
Nenhum dado/credencial do site publicado foi acessado nesta etapa.

Os arquivos SQL antigos 005/006/007 nao estao mais na pasta local. Eles nao
foram recriados sobre possiveis alteracoes do usuario. Dois testes especificos
dos arquivos antigos 005/006 foram omitidos; suas rotas e regras de negocio
continuam cobertas. A nova estrutura 008 e o schema completo sao verificados.

Para voltar de versao, use o pacote de seguranca Next 16.3.6 anterior, sem
apagar a coluna/tabela adicionadas e sem restaurar um banco antigo. As datas
ja corrigidas continuarao valendo e o historico sera preservado no banco,
embora nao seja exibido na interface antiga.
