# Vemo Assistente: consultas do negocio

Pacote cumulativo: `vemo-assistente-consultas.tar.gz`.
Mantem Next.js 16.3.6 e as entregas anteriores desta mesma base.

## Publicar

1. Guarde backup do banco e da implantacao atual.
2. Esta etapa nao cria tabelas ou colunas. Se a etapa de correcao da data
   ainda nao foi instalada, aplique uma vez o SQL 008 do pacote anterior
   `vemo-correcao-data.tar.gz`, seguindo ATUALIZAR-CORRECAO-DATA.md.
   Se ja aplicou, nao repita. Nao importe schema.sql no banco existente.
3. Envie este pacote na mesma aplicacao Next.js da Hostinger. Preserve as
   variaveis de banco, APP_URL e email, raiz `/`, npm run build e npm start.
4. Nao e necessario contratar provedor de IA nem adicionar uma chave nova.

Os SQLs antigos 005/006/007/008 nao estao mais na pasta local. Nao foram
recriados sobre possiveis alteracoes do usuario. Esta entrega nao os inclui;
utilize o pacote anterior se a migracao 008 ainda estiver pendente.

## O que muda

O botao Assistente fica no cabecalho das paginas internas, no computador e
celular. Abre um painel com cinco consultas baseadas nos registros da conta:

- Agenda de hoje e amanha, incluindo compromissos que atravessam a meia-noite.
- Valores a receber de orcamentos aprovados, em andamento ou finalizados.
- Entradas registradas do primeiro dia do mes ate hoje.
- Orcamentos enviados ha pelo menos tres dias, ainda validos e sem resposta.

Datas seguem Brasilia. Cada resposta identifica periodo e origem, mostra
ate dez registros, informa a quantidade total e oferece links para o modulo.
Atualizar consulta busca os dados novamente. Fechar limpa a consulta exibida.
Falhas mostram erro e opcao de tentar novamente, nunca um falso saldo zero.

As entradas vem somente do financeiro: status Pago nao e somado novamente.
Valores a receber sao uma previsao, nao saldo bancario nem divida vencida.
Nao ha data de vencimento de pagamento suficiente para afirmar atraso.

## Limites desta etapa

Consultas por botoes, com regras fixas, sem modelo de IA externo. Ainda nao
ha conversa livre, audio, leitura de recibos, execucao, cobranca automatica
ou envio de WhatsApp. Nenhum registro e alterado pelas consultas.
O dono continua usando os formularios existentes para executar as acoes.

## Conferir na Hostinger

1. Entre e abra Assistente em Clientes, Agenda e Financas.
2. Compare hoje/amanha com a Agenda, incluindo um compromisso cancelado.
3. Compare Entradas do mes com os lancamentos ate hoje, sem despesas ou
   entradas futuras. Um orcamento pago nao deve duplicar o recebimento.
4. Compare valores a receber e orcamentos enviados com os registros originais.
5. Confira links, atualizar, fechar/reabrir e a visualizacao no celular.
6. Entre em outra conta e confirme que somente seus registros aparecem.

O MySQL real e a publicacao dependem desta verificacao na hospedagem.
Nenhuma credencial ou dado do site publicado foi acessado nesta etapa.

## Verificacao local

Skills aplicadas: componentes/interacao, navegacao, composicao visual,
acessibilidade, React, seguranca e testes de interface.
Compilacao de producao, 59 testes automatizados e testes de acesso do servidor
passaram. Tres verificacoes dos arquivos SQL ausentes foram omitidas
(005, 006 e 008); as regras e rotas continuam cobertas por testes.

Playwright em Chrome local: cinco consultas, requisicoes apenas ao escolher,
teclado/foco, fechamento/reabertura, erro/reenvio, estado vazio, links e
respostas atrasadas. Telas de 320, 390 e 1440 pixels sem transbordamento
horizontal ou erros de execucao da pagina. Capturas inspecionadas em celular
e computador. Browser plugin indisponivel; usado Playwright local.
Os testes visuais usam respostas simuladas e os testes de rotas usam banco
simulado. Eles nao substituem a conferencia dos dados reais na hospedagem.
