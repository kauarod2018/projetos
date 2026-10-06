# Assistente: resumo financeiro mensal

Pacote cumulativo: `vemo-assistente-resumo-mensal.tar.gz`.

## Publicar

Guarde backup e atualize a mesma aplicacao Next.js na Hostinger com este
pacote. Preserve as variaveis de ambiente, raiz /, npm run build e npm start.
Nao ha SQL novo nem chave de IA. As migracoes anteriores ate 009 precisam
estar aplicadas. Nao repita migracoes nem importe schema.sql no banco existente.
Os SQLs 005/006/007/008/009 nao estao na pasta local; consulte os pacotes
anteriores caso falte alguma etapa.

## Consultar e testar

Abra Assistente > Resumo financeiro do mes, ou escreva "Quanto sobrou este
mes?". O resultado apresenta Entrou, Saiu e O que sobrou. Quando a diferenca
for negativa, aparece "Saiu a mais do que entrou", com o valor negativo.

O periodo vai do primeiro dia do mes ate hoje, considerando Brasilia.
Lancamentos futuros e de outros meses nao entram. Os recebimentos vinculados
a orcamentos entram uma vez, como movimentacao financeira: o status Pago
do orcamento nao e somado outra vez. Valores a receber continuam separados.

O resumo considera somente os registros do sistema. Nao e saldo bancario,
lucro contabil nem previsao de quanto pode gastar. Nao consulta bancos,
nao cria lancamentos e nao usa IA externa.

Mostra os dez registros mais recentes; os totais consideram todos os registros
elegiveis. Abrir registros leva ao Financeiro. Compare os numeros com os
lancamentos do periodo. Teste tambem mes vazio, mais saidas que entradas e
outra conta. Atualizar consulta busca os dados novamente. Falha no carregamento
aparece como erro, nao como zero.

## Verificacao local

Skills aplicadas: seguranca, React, acessibilidade e testes de interface.
Build de producao, verificacao de acesso do servidor e 76 testes passaram.
Quatro verificacoes de arquivos SQL ausentes (005/006/008/009) foram excluidas
da selecao; testes de regras, isolamento e falhas do banco permanecem.

Conferidos periodo/virada de mes em Brasilia, isolamento entre contas, exclusao
de datas futuras, total negativo, mes vazio, limite de dez sem truncar totais,
falha sem zero falso e reconhecimento de perguntas sem sugerir gastos.

Browser plugin indisponivel: usado Playwright com Chrome e APIs simuladas em
320, 390 e 1440 pixels. Testados botao, pergunta por texto, atualizacao, erro e
nova tentativa, valores positivos/negativos/vazios e consultas anteriores.
Capturas revisadas visualmente. Nenhuma gravacao ou acesso ao MySQL real.
Confira os numeros na Hostinger apos publicar.
