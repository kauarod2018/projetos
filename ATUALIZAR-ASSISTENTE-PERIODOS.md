# Assistente: consultar meses anteriores

Pacote cumulativo: `vemo-assistente-periodos.tar.gz`.

## Publicar

Guarde backup e atualize a mesma aplicacao Next.js na Hostinger com o pacote.
Preserve as variaveis de ambiente, raiz /, npm run build e npm start.
Nao ha SQL novo nem chave de IA. As migracoes anteriores ate 009 precisam
estar aplicadas. Nao reimporte schema.sql no banco existente nem repita SQLs.
Os SQLs 005/006/007/008/009 foram retirados da pasta local; se alguma etapa
estiver pendente, consulte os pacotes anteriores.

## Usar e conferir

Abra Assistente > Resumo financeiro do mes. Escolha o mes e toque na lupa
Consultar mes. Alterar o campo sem confirmar nao muda a consulta exibida.
Meses anteriores incluem todos os dias do mes. O mes atual vai somente ate
hoje, em Brasilia. O periodo aparece junto ao resultado. Voltar ao mes atual
retorna a consulta inicial. Nao sao aceitos meses futuros ou anteriores a 2000.

Confira Entrou, Saiu e O que sobrou contra os lancamentos do mes escolhido.
Teste um mes vazio e uma conta diferente. Atualizar consulta e Tentar
novamente preservam o periodo. A pergunta Quanto sobrou este mes? volta ao
mes atual; fechar a Assistente tambem limpa a selecao.

Os totais consideram todos os lancamentos elegiveis; a lista mostra ate dez.
Nao soma orcamentos novamente, nao altera registros, nao consulta bancos
e nao indica saldo bancario ou limite para gastar. Nao ha IA externa.

## Verificacao local

Skills: formularios, acessibilidade, seguranca, React e testes de interface.
Build de producao, verificacao de acesso do servidor e 78 testes passaram.
Quatro verificacoes dependentes de arquivos SQL ausentes foram excluidas da
selecao. Testes de regras, validacao e isolamento continuam incluidos.

Conferidos ano bissexto, virada de ano, horario de Brasilia, meses invalidos,
parametros duplicados, isolamento por conta e totais historicos.
Browser plugin indisponivel: usado Playwright com Chrome e APIs simuladas.
Conferidos 320/390/1440 pixels, foco em erro, confirmacao da selecao, consulta
vazia, falha e nova tentativa, troca rapida sem resposta antiga, volta ao mes
atual, pergunta por texto e consultas anteriores. Capturas revisadas.
Nao houve acesso ao MySQL real nem publicacao automatica na Hostinger.
