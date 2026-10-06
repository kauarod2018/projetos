# Vemo: remodelacao incremental

## Entrega mais recente: cadastro de cliente por texto na Assistente

Frases como "Cadastre cliente Ana Souza, celular (11) 99999-9999" preenchem
nome e telefone no cadastro guiado. O usuario pode completar os demais campos,
revisa os dados e confirma antes de gravar. Pedidos ambiguos ou contatos
invalidos sao recusados. A API existente valida e isola a conta; sua chave de
solicitacao protege retries do mesmo formulario. Sem nova migracao. Guia:
`ATUALIZAR-ASSISTENTE-CLIENTE-TEXTO.md`.

## Entrega anterior: despesa por texto na Assistente

Frases como "Paguei R$ 80 em material" preenchem descricao e valor no
formulario de despesas. Categoria e data ficam para revisao antes da
confirmacao. Pedidos incompletos ou ambiguos nao sao registrados nem
encaminhados como recebimento. O fluxo existente continua protegido contra
gravacoes repetidas. Sem nova migracao. Guia:
`ATUALIZAR-ASSISTENTE-DESPESA-TEXTO.md`.

## Entrega anterior: clientes com valores a receber na Assistente

A pergunta "Quem esta me devendo?" e o botao "Clientes com valores a receber"
mostram orcamentos aceitos ainda nao quitados, agrupados por cadastro e com
acesso ao historico do cliente. O total considera todos os grupos, mesmo quando
a lista exibe apenas os primeiros dez. Nao ha classificacao de atraso sem data
de vencimento. Sem nova migracao. Guia:
`ATUALIZAR-ASSISTENTE-CLIENTES-A-RECEBER.md`.

## Entrega anterior: orcamento preparado por texto na Assistente

Frases como "Cria um orcamento de R$ 900 para a Ana" preenchem cliente e valor
no editor. Um cadastro unico com nome exato e selecionado; sem correspondencia,
o nome fica como novo cliente em rascunho. O usuario ainda descreve o item,
confere tudo e salva manualmente. Nao envia nem grava durante a interpretacao.
Sem nova migracao. Guia: `ATUALIZAR-ASSISTENTE-ORCAMENTO-TEXTO.md`.

## Entrega mais recente: agendamento por texto na Assistente

Reconhece um dia da semana, horario e nome em pedidos como "Marca a Ana sexta
as 14h". Converte para data explicita de Brasilia, preenche o formulario e
seleciona cliente somente se houver um unico cadastro com nome exato. Assunto,
duracao, revisao e confirmacao continuam com o usuario; conflitos sao
revalidados pela API da Agenda. Sem nova migracao. Guia:
`ATUALIZAR-ASSISTENTE-AGENDAMENTO-TEXTO.md`.

## Entrega anterior: recebimento por texto na Assistente

A caixa de texto entende um comando limitado com valor em reais e nome do
cliente, localiza orcamentos da conta com o total integral exato e inicia o
fluxo existente de revisao e confirmacao. Nenhuma gravacao acontece durante a
interpretacao ou busca. Nao reconhece pagamento parcial, datas historicas ou
texto ambiguo, e ainda nao usa IA generativa. Sem nova migracao. Guia:
`ATUALIZAR-ASSISTENTE-RECEBIMENTO-TEXTO.md`.

## Entrega anterior: historico do cliente

Pagina individual, orcamentos e atendimentos paginados, contato, observacoes e
atalhos com cliente/data preselecionados. Consultas protegidas por conta e
cliente. Nenhuma nova tabela ou migracao; requer a Agenda (006) ja instalada.
Guia atual: `ATUALIZAR-HISTORICO.md`. Nao e auditoria nem extrato financeiro.

## Entrega atual: recebimento Pix em orcamentos

Configuracoes permite salvar uma chave Pix aleatoria UUID v4, nome do
recebedor e cidade na coluna `users.business_profile` ja existente na base
confirmada pelo usuario. A pagina publica do orcamento mostra BR Code estatico,
QR local e Pix Copia e Cola somente depois do aceite, se o pagamento for Pix.
Nao existe confirmacao bancaria nem transicao automatica para Pago. Guia:
`ATUALIZAR-PIX-ORCAMENTOS.md`.

## Entrega atual: Agenda

O usuario informou que publicou e testou a entrega de Servicos. A entrega de
Agenda continua exatamente essa base; nao recupera funcionalidades ausentes
de outras versoes. O guia atual e `ATUALIZAR-AGENDA.md`.
Agenda e integracao com Hoje estao implementadas. Historico abaixo preserva o
contexto da recuperacao; as restricoes se aplicam ao substituir outra versao.

## Base e limite de publicacao

Este trabalho foi iniciado na copia recuperada em
`../skill-creator-c-users-kauar-codex/work/vemogestao-restaurado/last-source`.
Os arquivos recuperados e os backups originais nao foram modificados.

A base recuperada nao inclui algumas entregas posteriores citadas na conversa,
como envio de sugestoes e perfil do negocio. Nao e uma atualizacao cumulativa
dessas outras versoes. Nao importar um banco antigo.

Foram acrescentadas as tabelas de servicos e agenda no codigo e no SQL.
APIs de autenticacao e credenciais nao foram alteradas nesta etapa.
Nenhum dado foi escrito no banco da Hostinger.

## Escopo entregue

- Menu: Hoje, Clientes, Agenda, Financeiro, Orcamentos, Servicos, Configuracoes.
- Hoje em `/hoje`, com dados das APIs autenticadas existentes.
- `/home` redireciona para Hoje; `/dashboard` preserva o acesso aos orcamentos.
- Lista de orcamentos em `/orcamentos`, incluindo filtros de rascunhos,
  validades encerradas e retornos pendentes ha pelo menos tres dias.
- Atalho de novo cliente abre o formulario existente.
- Preparar mensagem permite revisar e copiar um texto padrao, sem IA,
  envio automatico, alteracao de status ou gravacao de dados.
- Configuracoes mostra os dados da conta e os acessos de verificacao/redefinicao.
- Servicos: cadastro, busca, edicao, arquivamento com confirmacao e reativacao.
- Preco e duracao no catalogo, com selecao no formulario de orcamento.
  A descricao e o preco sao copiados; alteracoes futuras no catalogo nao
  modificam documentos anteriores. A duracao nao agenda compromissos.
- APIs de servicos autenticadas, isoladas por conta, com validacao no servidor,
  criacao resistente a repeticao e bloqueio de edicoes desatualizadas.
- Agenda por dia/sete dias com cliente, servico, duracao, observacoes e status.
- Confirmacao de cancelamento/conclusao/reabertura, bloqueio de conflitos,
  isolamento por conta e versoes de edicao. Concluir nao registra recebimento.
- Hoje mostra compromissos reais da API, sem cancelados, no horario de Brasilia.
- Perfil do negocio ainda indisponivel nesta base. Nenhum dado ficticio no produto.

## Regras do Hoje

- A receber: total de orcamentos aprovados, em andamento e finalizados.
  Nao significa previsto para hoje e nao considera vencimento de cobranca.
- Aguardando: enviados dentro da validade, incluindo a data final.
- Pendencias: rascunhos + enviados expirados + enviados validos sem resposta
  ha pelo menos tres dias do calendario local. Grupos nao se sobrepoem.
- Movimento: somente lancamentos manuais com a data local de hoje.
  `updatedAt` de um orcamento nao e uma data confiavel de pagamento.
- Falha de consulta aparece como indisponibilidade, nunca como saldo zero.
- A pagina recalcula o dia a cada minuto e atualiza dados quando volta ao foco.

## Proximas etapas aprovadas

O mapa atualizado, incluindo a assistente como centro do produto, proatividade,
audio/recibos e confirmacao + historico + desfazer, esta em `MAPA-PRODUTO.md`.
Esses itens sao o plano de construcao, nao funcionalidades ja entregues.

1. Reconciliar esta base com a ultima versao publicada antes de qualquer deploy.
2. Refinar Clientes; catalogo de Servicos implementado, pendente de teste MySQL.
3. Agenda implementada; validar MySQL e concorrencia na hospedagem.
4. Integrar Orcamentos e Financeiro sem duplicar recebimentos.
5. Assistente global: consultas permitidas, alteracoes com confirmacao.
6. Acabamento e validacao mobile continuos.

Fora desta fase: WhatsApp automatico, fiscal, estoque, funcionarios,
multiempresa, campanhas, integracao bancaria e aplicativo nativo.

## Verificacao local

`npm run typecheck`

`node --test scripts/test-today.mjs scripts/test-security.mjs scripts/test-quote-editing.mjs scripts/test-whatsapp.mjs scripts/test-services.mjs scripts/test-service-routes.mjs`

`npm run build`

`node scripts/test-runtime.mjs`

A verificacao de interface usa Playwright com respostas de API simuladas
somente no navegador de teste. Fixtures e capturas ficam fora do codigo do
produto em `../vemo-remodelacao-qa`. Nenhum bypass de login foi criado no site.
Banco real, SMTP e persistencia devem ser validados em homologacao.
Para esta entrega, leia `ATUALIZAR-AGENDA.md` antes de qualquer importacao.
