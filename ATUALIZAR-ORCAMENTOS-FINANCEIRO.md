# Vemo: orcamentos e financeiro

Atualizacao de 06/10/2026. O pacote e codigo-fonte; o site hospedado e o banco real nao foram alterados automaticamente.

## Orcamentos

- Excluir esta disponivel na lista e no detalhe, com confirmacao, estado de processamento e erro visivel. Orcamento pronto sem vinculos pode ser excluido definitivamente.
- Havendo atendimento, cobranca ou movimentacao vinculada, inclusive historico financeiro anulado, a exclusao definitiva e recusada. Use Arquivar: retira da lista ativa, preserva registros e invalida o link de aceite. Nada e recebido, estornado ou cancelado por arquivar.
- Para restaurar, abra Orcamentos, selecione Mostrar > Arquivados e use Restaurar. O link de aceite anterior nao volta a valer; use o link atual quando apropriado.
- Orcamentos antigos sem recebimento vinculado podem ter sua etapa corrigida. Atendimento concluido/cancelado e cobranca cancelada nao bloqueiam sozinhos a mudanca de etapa. Vinculos operacionais ainda abertos continuam protegidos.
- Orcamento com recebimento registrado nao pode ter o pagamento desfeito pelo seletor de status. Marcar Pago exige registrar ou vincular o recebimento; mudar a etapa nao altera dinheiro.
- Edicao em outra janela e detectada: atualize antes de repetir. Orcamento arquivado precisa ser restaurado antes de alterar a etapa. Aprovacao anterior permanece no historico; corrigir a etapa nao autoriza sobrescrever um documento ja aceito.
- Arquivar nao oculta os valores das financas nem os atendimentos. Esses vinculos devem continuar disponiveis para cobranca, conferencia e historico.

## Financeiro

- Movimentacoes do mes aparecem antes dos graficos, com data, descricao/origem, tipo, categoria e valor alinhado. Filtros por texto, entrada/saida e categoria foram preservados. CSV exporta o mes selecionado, nao apenas o filtro de busca.
- Contas em aberto usam tabelas separadas A receber e A pagar, ordenadas por vencimento, com cliente, parcela, vencimento, total, recebido/pago e saldo restante. Valores de cada grupo nao sao somados a projecao dos orcamentos.
- Busca por cliente/descricao/data e filtro de vencidas, hoje ou a vencer. Saldo dos resultados acompanha os filtros. Registro de nova conta fica recolhido ate abrir Nova conta prevista.
- Receber/Pagar registra a movimentacao e atualiza tambem o resumo e a tabela do caixa. Cancelar parcela exige confirmacao e preserva os pagamentos anteriores.
- Projecao dos orcamentos fica em secao separada; pode conter os mesmos servicos ja presentes em contas a receber. Nao e dinheiro registrado nem total adicional de recebiveis.
- No celular, cada registro mostra os titulos dos campos em uma disposicao vertical; no desktop, colunas alinhadas. Dados vazios, falhas e nomes longos foram incluidos na verificacao.
- Falha de carregamento nao e apresentada como saldo zero: o resumo fica indisponivel, com opcao de tentar novamente.

## Atualizar sem perder dados

1. Faca backup e confira a restauracao em banco separado.
2. Se o banco ja recebeu a entrega anterior com 016, aplique somente `database/017-quote-archive.sql`, uma vez. Orcamentos existentes ficam ativos; nenhum pagamento ou atendimento e removido. Se ha migracoes anteriores pendentes, aplique somente as pendentes em ordem.
3. Banco novo: use `database/schema.sql`, sem aplicar as migracoes sobre ele. Nunca rode schema.sql sobre banco com dados.
4. Publique o novo codigo, mantenha as variaveis privadas existentes, execute `npm ci`, `npm run test:unit`, `npm run build` e reinicie o servidor Node.
5. Teste na homologacao: exclusao sem vinculos; exclusao recusada com historico; arquivamento/restauracao; link de aceite revogado; correcoes em orcamento antigo; bloqueio de pagamento; conflito entre duas abas; filtro financeiro e recebimento atualizando o caixa.

Os testes locais usam dados ficticios e banco simulado. Nao comprovam o banco da sua hospedagem, concorrencia real ou pagamentos externos. `VALIDACAO.md` continua obrigatorio antes do uso com clientes reais.
