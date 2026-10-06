# Assistente: primeiras consultas por texto

Pacote cumulativo: `vemo-assistente-perguntas.tar.gz`.

## Atualizar

Guarde backup e envie o pacote na mesma aplicacao Next.js da Hostinger.
Mantenha as variaveis de ambiente, raiz /, npm run build e npm start.
Nao ha SQL novo nem chave de IA para configurar. As migracoes anteriores
ate 008 devem estar aplicadas; nao repita migracoes e nao importe schema.sql
sobre o banco existente. Os SQLs antigos 005/006/007/008 continuam disponiveis
nos pacotes anteriores, nao foram recriados na pasta local.

## Testar

Abra Assistente e digite uma destas perguntas:

- Agenda de hoje?
- Qual a agenda de amanha?
- Quanto tenho a receber?
- Quanto recebi este mes?
- Orcamentos sem resposta

Pressione Enter ou o botao de consulta. Confira os registros e o periodo
apresentado. Teste tambem uma pergunta desconhecida: ela deve exibir um aviso
e nao manter o resultado anterior como se fosse resposta a essa pergunta.
Os botoes das consultas e os fluxos de agendamento/recebimento continuam.

## Limites importantes

Este e um primeiro acesso por frases reconhecidas, nao uma IA de conversa
livre. Aceita variacoes cadastradas, acentos, maiusculas e espacos. Pedidos
compostos, filtros por cliente, outros periodos e alteracoes nao sao executados.
Nao interpreta "quem esta atrasado" como valores a receber: os dados atuais
nao comprovam atraso de pagamento. Nao calcula quanto pode gastar.

O texto nao e enviado ao servidor ou salvo por este recurso. Apenas o tipo
da consulta reconhecida vai para a API existente, que valida a sessao e filtra
os dados pela conta. Nao ha integracao com provedor externo nem custo de IA.

## Validacao

67 testes automatizados passaram, incluindo reconhecimento e rejeicao de
frases com comandos, negacao, cliente, periodo ou tamanho nao suportados.
Tres verificacoes de arquivos SQL ausentes (005, 006 e 008) foram excluidas
da selecao; os testes de regras e rotas correspondentes permanecem.

Build de producao e verificacao de acesso do servidor passaram. Browser plugin
indisponivel: usado Playwright com Chrome local e APIs simuladas. Testados
320, 390 e 1440 pixels, as cinco perguntas via Enter, validacao e retorno de
foco, correcao do erro, falha de consulta e nova tentativa, respostas antigas,
estados vazios e navegacao. Capturas revisadas sem cortes ou sobreposicoes;
nenhum erro de pagina observado. Nao foram feitas gravacoes nos testes.

O banco real da Hostinger nao foi acessado. Confira o fluxo publicado nas
suas contas antes de disponibilizar a atualizacao a todos os usuarios.
