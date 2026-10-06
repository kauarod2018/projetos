# Vemo: secretaria do dono

Referencia de produto recebida em 28/09/2026. Este documento descreve o destino
do produto; nao afirma que as funcoes abaixo ja estejam implementadas.

## Problema e principio central

Quem trabalha por conta propria precisa administrar atendimento, compromissos,
orcamentos e dinheiro sem registrar a mesma informacao em varias telas.
A Vemo deve ajudar o dono a consultar, decidir e executar esse trabalho.
O WhatsApp sera um canal futuro, nao a definicao do produto.

O trabalho de fundacao nos modulos existe para sustentar a assistente central,
nao para trata-la como um recurso secundario. O uso manual continua disponivel.

## Mapa

- Hoje + Vemo Assistente: agenda do dia, dinheiro, pendencias, retornos e conversa.
- Clientes: cadastro, contato, historico, observacoes e situacao.
- Agenda: compromissos, servicos, horarios, duracao, status e recorrencia simples.
- Financeiro: entradas, saidas, valores a receber/pagar e movimento mensal.
- Orcamentos: criar, salvar, compartilhar manualmente e acompanhar o aceite.
- Servicos: nome, preco, duracao e descricao.
- Configuracoes: negocio, perfil, horarios, preferencias e conta.
- Assistente global, contextual, sem uma pagina obrigatoria isolada no menu.

## Primeiro fluxo completo da assistente

Pedido: "Registra R$ 180 que recebi do Carlos".

1. Identificar a conta autenticada no servidor.
2. Encontrar o cliente e perguntar qual Carlos se houver ambiguidade.
3. Verificar se o valor corresponde a um recebivel ja registrado.
4. Perguntar pelos campos obrigatorios ausentes; nao inventar pagamento/data.
5. Exibir cliente, valor, data, forma e vinculo que serao salvos.
6. Aguardar uma confirmacao explicita para aquela acao.
7. Revalidar permissao e estado dos dados no servidor; salvar uma unica vez.
8. Atualizar o financeiro e o historico do cliente, exibindo o registro criado.
9. Oferecer desfazer apenas se o estado atual permitir uma reversao segura.

Criterio de entrega: repetir clique, pedido ou tentativa de rede nao duplica
recebimento. Cancelar nao grava nada. Falha nao e apresentada como sucesso.
Nenhuma acao pode consultar ou alterar outra conta.

## Consultas e acoes por texto

Consultas iniciais: compromissos de amanha, clientes com valores pendentes,
total a receber, entradas registradas no mes e orcamentos sem resposta.
Sempre indicar periodo e origem dos numeros, separando recebido de previsto.

Acoes iniciais: cadastrar cliente, preparar agendamento, registrar entrada ou
saida e preparar orcamento. Validacoes e permissoes pertencem ao servidor,
nao ao modelo. A assistente usa operacoes limitadas; nunca SQL arbitrario.

Datas relativas como "sexta" precisam virar uma data explicita na confirmacao.
Agendamentos precisam considerar duracao, horario de atendimento e conflitos.
Uma tarefa com varias alteracoes mostra cada uma e o resultado de cada etapa;
nao informa conclusao total quando alguma parte falhou.

## Proatividade no Hoje

Ao abrir, apresentar resumo e proximas acoes com base em dados verificaveis:
atendimentos do dia, recebiveis vencidos, orcamentos sem resposta e conflitos.
Agrupar e priorizar pendencias sem repetir avisos desnecessariamente.

Vencido exige data de vencimento do recebivel. Validade do orcamento e outra
informacao. Horario livre exige agenda, duracao e expediente conhecidos.
Preparar cobranca ou retorno nao significa enviar; o dono revisa primeiro.
O resumo pode usar regras deterministicas antes da integracao com um modelo.

## Historico e desfazer

Registrar autor, conta, horario, acao, objetos relacionados, confirmacao e
resultado. Exibir "Feito pela Vemo" somente para acoes efetivamente executadas.
Usar operacao identificavel e resistente a repeticao; nao registrar segredos.

Desfazer verifica alteracoes posteriores e dependencias. No financeiro, manter
rastro de reversao em vez de apagar silenciosamente o historico. Uma mensagem
ja enviada nao e recuperavel: nunca oferecer um falso botao de desfazer.
Cancelamento de compromisso nao deve virar exclusao definitiva implicitamente.

## Etapas posteriores ao fluxo por texto

- Audio: transcricao revisavel, permissao de microfone somente ao solicitar,
  alternativa por texto e confirmacao antes de qualquer gravacao no negocio.
- Recibos: extrair valor, data e descricao; pedir confirmacao de campos incertos,
  evitar duplicatas e limitar tipo/tamanho do arquivo. Definir retencao e exclusao.
- Conteudo de fotos, transcricoes e mensagens de clientes e dado nao confiavel,
  nunca uma autorizacao para executar comandos ou revelar informacoes privadas.
- Analises cruzadas: relacionar agenda, clientes e financeiro, diferenciando
  resultados realizados de projecoes e comparando periodos equivalentes.
- "Quanto posso gastar": estimativa explicada pelos registros disponiveis,
  com compromissos futuros e lacunas visiveis, nunca garantia de saldo bancario.
- Clientes inativos: ausencia de registros nao prova ausencia de compras.
- Campanhas: preparar segmento e texto para revisao numa etapa futura;
  envio em massa e WhatsApp automatico continuam fora do MVP atual.

## Sequencia de construcao

1. Recuperar a base mais recente e disponibilizar acesso de teste isolado.
2. Integrar Clientes, Servicos, Agenda, Orcamentos e Financeiro com identificadores
   estaveis, recebiveis e pagamentos distintos. Concluir servico nao marca pago.
3. Historico, confirmacao, prevencao de duplicatas e reversoes seguras.
4. Assistente por texto: entregar primeiro o fluxo completo de recebimento.
5. Ampliar as acoes e conectar o resumo proativo do Hoje.
6. Validar uso real; depois audio, recibos e analises cruzadas.

Nao ampliar esta primeira entrega para construir todos os recursos de uma vez.
Sem acesso funcional, dados confiaveis ou confirmacoes verificadas, nao publicar
acoes financeiras da assistente. Infraestrutura do provedor de IA e seus custos
serao definidos antes dessa integracao, sem expor chaves no navegador.

## Situacao atual

Menu, Hoje, catalogo de Servicos e Agenda foram implementados localmente.
O historico individual do cliente reune orcamentos, atendimentos e recebimentos vinculados paginados e
atalhos contextuais. Mostra o estado atual, nao uma trilha de auditoria.
O catalogo preenche itens de orcamento como copias independentes. A Agenda
vincula clientes/servicos, confere conflitos e alimenta o Hoje, sem marcar
pagamentos. Recorrencia, assistente real, audio, recibos e historico reversivel
ainda nao estao implementados.
Recebimentos integrais podem ser registrados ou vinculados a uma entrada
existente no orcamento. O financeiro soma apenas movimentacoes datadas, sem
somar o status Pago novamente. Quitacoes vinculadas ficam protegidas contra
exclusao e mudanca de etapa. A data do recebimento pode ser corrigida com
motivo, confirmacao, controle de versao e historico privado persistido.
Parcelas, estornos e alteracao do valor seguem pendentes.
O Hoje atual le orcamentos e lancamentos (inclusive recebimentos vinculados);
nao conhece vencimentos.
A copia local esta sem configuracao de banco e nao permite login real.
O usuario informou ter aplicado os SQLs anteriores, publicado e testado as
entregas ate Recebimentos e a atualizacao de seguranca Next.js 16.3.6.
A correcao da data depende da nova migracao 008 e da publicacao pelo usuario.
O Assistente global oferece consultas por botoes e frases cadastradas, com
regras fixas, periodo/origem, atualizacao e links para os registros. A API exige
sessao e filtra pela conta. Uma frase de recebimento explicitamente suportada
pode iniciar a busca guiada descrita abaixo; conversa livre e modelo externo
continuam como etapas futuras.
A Assistente tambem oferece recebimento guiado: busca e selecao de um
orcamento, revisao e formulario existente de confirmacao. Reutiliza a API
de recebimento integral, inclusive vinculacao de entrada e prevencao de
duplicatas. Apos salvar, abre o orcamento atualizado. O recebimento so e
gravado apos revisao e confirmacao; nao verifica pagamento bancario.
O agendamento guiado da Assistente reutiliza o formulario e a API da Agenda,
com revisao de cliente, assunto, inicio, termino e observacoes antes de enviar.
O servidor confere conflitos ao confirmar. Apos salvar, abre o dia na Agenda.
Conversa livre, audio, calendario externo e regras de expediente seguem fora
desta etapa; revisar nao reserva o horario e agendar nao registra pagamento.
Nenhum dado da Hostinger foi acessado ou alterado pelas ferramentas desta etapa.

A caixa de texto da Assistente reconhece pedidos simples como "Registra R$ 180
que recebi do Carlos". Ela preenche cliente e valor, e a API autenticada busca
somente orcamentos da conta com o mesmo valor integral; a confirmacao existente
continua obrigatoria. A data sugerida (hoje) e mostrada para revisao. Texto nao
reconhecido, nomes ambiguos, pagamento parcial ou nenhum orcamento correspondente
nao alteram dados. Ainda nao ha IA generativa nem conversa aberta.

A mesma caixa de texto tambem prepara pedidos como "Marca a Ana sexta as
14h". A proxima sexta-feira e convertida para data explicita no horario de
Brasilia; cliente so e pre-selecionado quando existe um unico cadastro com nome
exatamente igual. O usuario completa assunto e duracao, revisa e confirma; o
servidor revalida conflitos. Datas sem dia da semana, pedidos negados, horarios
ausentes ou ambiguos nao criam compromissos. Nenhum SQL novo.

O Hoje agora inclui um resumo proativo deterministico, com proximo atendimento,
recebiveis e retorno elegivel mais antigo. Os atalhos abrem agendamento,
recebimento ou preparacao de mensagem, sem executar mudancas automaticamente.
Reutiliza os dados da tela e distingue falha de carregamento de ausencia de
registros. Dia e calculos do Hoje usam Brasilia. Nao e monitoramento em segundo
plano, analise por modelo externo nem confirmacao de saldo/pagamento bancario.

O resumo do Hoje tambem consulta contas previstas vencidas e com vencimento em
ate sete dias, separando receber/pagar e descontando pagamentos parciais. A API
agrega os dados no servidor por conta autenticada, sem depender do limite de
itens da lista do Financeiro. Nenhuma acao financeira e feita automaticamente;
atalho abre diretamente a secao de contas previstas. Sem migracao adicional.

A Assistente aceita frases cadastradas para as consultas, alem dos botoes. A
correspondencia considera a frase inteira. Nas consultas, a API recebe somente
o topico permitido; no comando de recebimento, o texto bruto permanece no
navegador e a API autenticada recebe apenas cliente e valor extraidos. Esse e
um interpretador limitado, nao IA generativa ou conversa aberta.

Cadastro guiado de cliente disponivel na Assistente: formulario, revisao e
confirmacao explicita, reutilizando validacao e API de Clientes. O SQL 009
adiciona chave opcional de solicitacao por conta para retries sem duplicacao.
Uma chave salva com dados diferentes retorna conflito; nomes iguais nao sao
fundidos. A chave permanece somente durante o fluxo aberto, nao entre recargas.
Nao ha interpretacao livre nem envio de mensagem. A publicacao e a importacao
do SQL 009 dependem do usuario; nao foram executadas na Hostinger.

A Assistente prepara agora um orcamento escolhendo cliente e servico ativo
opcional. A revisao segue para o editor existente por identificadores, sem
gravar ou enviar nada. O editor consulta novamente cliente/catalogo e permite
conferir itens e condicoes antes da gravacao habitual. A preparacao nao e
persistida nem interpretada por IA. Nenhuma nova migracao foi adicionada.

Busca de clientes na Assistente usa nome, telefone ou email, com normalizacao
de acentos e formato telefonico. Mantem homonimos separados pelo cadastro e
contato, mostra dez resultados por vez e oferece historico e novo orcamento.
Reutiliza a API privada existente; nao pesquisa observacoes, nao grava dados
e nao interpreta comandos. A lista e carregada inteira e filtrada localmente.

Resumo financeiro mensal na Assistente apresenta entradas, saidas e diferenca
do primeiro dia do mes ate hoje em Brasilia. Usa apenas lancamentos da conta,
sem somar novamente orcamentos e sem datas futuras. Os dez registros exibidos
nao limitam os totais. Resultado negativo permanece negativo; falha nao vira
zero. Disponivel por botao e frases cadastradas, sem recomendacao de gasto,
saldo bancario, modelo externo ou nova migracao.

O resumo financeiro permite escolher meses anteriores por campo de mes e
confirmacao explicita. Meses encerrados incluem o periodo completo; o atual
vai ate hoje em Brasilia. Validacao no servidor rejeita meses futuros,
formato invalido, parametros duplicados ou mes em consultas nao suportadas.
Trocas descartam respostas antigas; retry preserva o mes. Pergunta sobre
este mes, botao de retorno e fechamento limpam a selecao. Sem nova migracao.

A Assistente tambem consulta o total de saidas registradas no mes, com
detalhamento limitado aos dez lancamentos mais recentes. Aceita perguntas
cadastradas como "quanto gastei este mes?" e permite consultar meses anteriores
com o mesmo seletor. O resultado usa somente despesas, com isolamento por
conta; nao interpreta categorias nem inclui valores sem lancamento.

O usuario pode registrar uma despesa pela Assistente preenchendo descricao,
valor e data, revisando e confirmando antes de gravar. A repeticao da mesma
solicitacao na mesma conta retorna o lancamento original. Requer migracao 010
em banco existente; a chave de repeticao e opcional e nao altera registros
anteriores.

Despesas podem ser classificadas em oito categorias no formulario do Financeiro
ou na Assistente. A consulta mensal mostra o total por categoria e a lista de
movimentacoes identifica a categoria. Migracao 011 atribui "Outros" as
despesas historicas; sem categoria nova para receitas. Requer 010 antes de 011.

A pagina principal do Financeiro inclui um grafico horizontal das despesas
por categoria para o mes selecionado, junto a uma lista acessivel de valores.
Mes vazio tem estado proprio. O grafico usa os lancamentos da conta ja
carregados para as metricas e nao dispara consultas adicionais.

O Financeiro permite exportar as movimentacoes registradas do mes escolhido
em CSV compativel com planilhas. Inclui tipo, descricao, categoria de despesas,
valor e vinculo a orcamento; nao inclui valores apenas previstos. Textos sao
escapados para CSV e neutralizados quando podem ser interpretados como formula.

O Financeiro compara entradas, despesas e saldo do mes escolhido com o mes
anterior usando somente movimentacoes datadas e registradas. Percentuais de
entradas e despesas usam o valor anterior como base; saldo mostra a diferenca
em reais para nao gerar percentual enganoso quando o mes anterior e negativo.

A lista mensal de movimentacoes pode ser filtrada por tipo e categoria e
pesquisada por descricao, data ou numero do orcamento. O total de resultados e
os estados sem correspondencia sao informados; filtros nao alteram a exportacao
CSV do mes inteiro.

O Financeiro mostra tambem o historico dos seis meses ate o mes selecionado,
com entradas, saidas e saldo. A visualizacao tem tabela equivalente acessivel,
usa somente movimentacoes registradas e apresenta estado vazio quando nao ha
lancamentos no periodo.

A Agenda permite preparar um lembrete manual pelo WhatsApp para atendimentos
futuros com telefone valido no cadastro vinculado. Nome, servico, data e hora
vao preenchidos para revisao do usuario; o Vemo nao envia a mensagem. O telefone
e lido somente junto ao cliente pertencente a mesma conta autenticada.

O cartao do cliente oferece acesso direto a um novo orcamento com esse cliente
pre-selecionado. A pessoa ainda confere servicos, valores e condicoes no fluxo
normal antes de salvar ou compartilhar.

A Assistente prepara orcamentos por frases limitadas como "Cria um orcamento de
R$ 900 para a Ana". Faz correspondencia exata do cliente na conta; nome novo
fica somente no rascunho e so sera cadastrado junto ao orcamento se o usuario
salvar. O valor preenche um item sem descricao, exigindo que o servico seja
informado. Nada e salvo ou enviado automaticamente; sem nova migracao.

A consulta "Quem esta me devendo?" agrupa os orcamentos aprovados, em andamento
ou finalizados ainda nao marcados como pagos por identificador de cliente.
Mostra valor por cliente, total geral e atalho para o historico. Clientes com
o mesmo nome permanecem separados. Nao chama esses valores de atrasados, pois
o sistema nao registra o vencimento de cada recebivel. Sem nova migracao.

A Assistente prepara uma despesa por texto em frases limitadas como "Paguei
R$ 80 em material". Descricao e valor preenchem o formulario existente; o
usuario revisa categoria e data, depois confirma para gravar. Pedidos de
despesa com valor invalido, mais de um valor ou data relativa nao sao
interpretados como recebimentos. Sem nova migracao.

A Assistente tambem preenche o cadastro de cliente por texto, com nome e
telefone brasileiro opcional. O usuario pode editar e completar o formulario,
revisar e confirmar antes da gravacao. O mesmo cadastro guiado e a mesma API
autenticada tratam a solicitacao; nomes iguais nao sao fundidos automaticamente.
Sem nova migracao.

A Assistente consulta contas previstas vencidas e com vencimento nos proximos
sete dias. Separa valores a receber e a pagar, desconta pagamentos parciais e
mostra no maximo dez parcelas de exemplo, preservando a contagem e os totais
completos por faixa. Orcamentos nao entram nessa consulta para evitar misturar
previsoes diferentes ou contar o mesmo servico duas vezes. A pergunta guiada
"O que vence esta semana?" abre essa consulta; os registros levam ao Financeiro.
Usa a sessao e o escopo da conta atual; nao exige nova migracao SQL.
