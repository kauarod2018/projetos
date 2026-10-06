# Assistente: recebimento guiado

Pacote cumulativo: `vemo-assistente-recebimentos.tar.gz`.
Inclui as consultas anteriores da Assistente e mantem Next.js 16.3.6.

## Atualizar na Hostinger

1. Guarde backup da implantacao atual e do banco.
2. Nao ha SQL novo nesta etapa. O banco precisa das etapas anteriores ate
   008 (correcao de data). Se ainda faltar 008, utilize o arquivo do pacote
   vemo-correcao-data.tar.gz. Nao repita migracoes ja aplicadas e nao importe
   schema.sql no banco existente.
3. Envie este pacote na mesma aplicacao Next.js, mantendo raiz `/`,
   npm run build e npm start. Preserve APP_URL, banco e configuracao de email.
4. Nao e necessario adicionar variaveis ou contratar uma API de IA.

Os SQLs 005/006/007/008 nao estao mais na pasta local e nao foram recriados.
Este pacote nao os inclui. Em caso de migracao pendente, consulte os pacotes
anteriores antes de atualizar.

## Usar

Abra Assistente e escolha Registrar recebimento. Busque por cliente, servico
ou numero do orcamento. A lista mostra ate 20 por pagina, com navegacao.
Clientes com o mesmo nome permanecem em linhas separadas por orcamento.

Escolha Revisar e confira cliente, descricao e valor integral. Depois abra
a confirmacao e escolha entre vincular uma entrada existente do mesmo valor
ou criar uma entrada. Confira a data e marque a confirmacao. Nada e salvo
apenas ao consultar, buscar, escolher, revisar ou cancelar.

Ao salvar, o orcamento atualizado e aberto, mostrando o recebimento. O
financeiro e o historico do cliente usam esse mesmo registro, sem somar o
status Pago novamente. A navegacao recarrega os dados para evitar totais
antigos no navegador. Conclua outros formularios abertos antes deste fluxo.

Orcamentos com recebimento vinculado nao aparecem na lista. Um orcamento
antigo marcado Pago mas sem entrada vinculada pode aparecer: confira o
financeiro e vincule o registro correto antes de criar outro.

## Protecoes e limites

A lista consulta somente a conta autenticada. Antes de salvar, a API
existente revalida conta, orcamento, valor, data, entrada e recebimento.
Repetir uma confirmacao com os mesmos dados nao duplica o registro.
Uma alteracao concorrente pode bloquear a confirmacao; cancele e confira
novamente o orcamento em vez de insistir com dados diferentes.

Esta entrega e um fluxo guiado por botoes, nao conversa livre com IA.
Nao confere pagamento no banco, nao gera Pix e nao envia mensagens.
Somente recebimentos integrais vinculados a orcamentos sao tratados aqui.
Parcelas, estornos e desfazer financeiro ficam para etapas futuras. O primeiro
comando estruturado por texto esta descrito em
`ATUALIZAR-ASSISTENTE-RECEBIMENTO-TEXTO.md`. Nao ha um novo historico de acoes
atribuidas a uma IA.

## Conferir com dados de teste

1. Busque um cliente com mais de um orcamento e confira o numero escolhido.
2. Abra a confirmacao e cancele: nada deve mudar no financeiro.
3. Crie uma entrada para um orcamento aprovado, com a data correta.
4. Confira o status Pago, o financeiro e o historico do cliente.
5. Em outro orcamento, vincule uma entrada existente de mesmo valor:
   a quantidade de entradas deve continuar igual.
6. Reabra a Assistente: o orcamento ja recebido nao deve aparecer na lista.
7. Confira outra conta, celular, busca vazia e navegacao da lista.

## Verificacao local e limites

Skills de formularios, acessibilidade, componentes, React, seguranca e testes
foram aplicadas. A interface reutiliza o formulario e a API de recebimento
existentes, sem duplicar a logica de gravacao.

63 testes automatizados passaram, com banco simulado. Tres verificacoes de
arquivos SQL ausentes (005, 006 e 008) foram omitidas; as regras e rotas
continuam cobertas. Os testes novos cobrem autenticacao, busca, paginacao,
isolamento entre contas, exclusao de recebimentos vinculados e erros seguros.

Playwright em Chrome local, com APIs simuladas: busca/paginacao, nomes iguais,
revisao/cancelamento sem escrita, confirmacao, entrada existente, conflito,
falha/reenvio, bloqueio durante envio e navegacao apos salvar. Telas de
320, 390 e 1440 pixels. Browser plugin indisponivel; usado Playwright local.
Capturas inspecionadas, sem sobreposicao ou transbordamento horizontal.
Compilacao de producao e testes de acesso do servidor passaram. Foram
retestadas as cinco consultas anteriores e o recebimento/correcao de data
na tela original do orcamento. Sem erros inesperados de console na nova
interface; erros de rede simulados eram esperados nos cenarios de falha.

A busca reutiliza o carregamento de orcamentos da conta, projetando apenas
os campos necessarios para a resposta. O desempenho com contas muito grandes
ainda requer medicao; a paginacao limita a resposta, nao a leitura interna.

O banco real, concorrencia real e a publicacao precisam ser conferidos na
Hostinger. Nenhuma credencial ou dado da hospedagem foi acessado.
