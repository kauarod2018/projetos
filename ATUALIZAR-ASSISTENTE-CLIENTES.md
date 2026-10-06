# Assistente: cadastro de cliente

Pacote cumulativo: `vemo-assistente-clientes.tar.gz`.
Mantem Next.js 16.3.6 e todas as entregas anteriores.

## Ordem de atualizacao

1. Guarde backup do banco e da implantacao atual.
2. No phpMyAdmin, selecione o banco Vemo e importe somente
   `database/009-customer-requests.sql`. As etapas anteriores ate 008 devem
   estar aplicadas. Nao importe schema.sql sobre o banco existente.
3. Confirme que a importacao terminou sem erros. O SQL acrescenta uma coluna
   opcional e um indice para identificar tentativas repetidas; nao remove
   clientes e nao altera seus dados de contato. Ele verifica os nomes antes
   de acrescentar coluna/indice, permitindo repetir uma importacao parcial.
4. Envie o pacote na mesma aplicacao Next.js da Hostinger. Preserve as
   variaveis de ambiente, raiz /, npm run build e npm start. Sem nova chave de IA.

O SQL 009 tambem esta no pacote. Os SQLs antigos 005/006/007/008 nao foram
recriados; se faltar alguma etapa, consulte os pacotes anteriores.

## Fluxo

Abra Assistente > Cadastrar cliente. Somente o nome e obrigatorio; contato,
endereco e observacoes sao opcionais. Revisar cadastro mostra os dados que
serao enviados, incluindo nome sem espacos externos e email em minusculas.
Voltar e editar preserva o formulario. Cancelar antes de confirmar nao grava.

Confirmar cadastro usa a mesma API do cadastro normal, com validacao no
servidor, sessao, origem da requisicao e conta do usuario. Durante o envio,
confirmacao, fechamento e retorno ficam bloqueados. Apos o sucesso, use
Abrir cliente para acessar o registro atualizado e seu historico.

Se a resposta se perder, repita a confirmacao na mesma tela. A mesma chave
de solicitacao retorna o cadastro existente, sem criar outro. Se os dados
mudaram depois de salvar, a tentativa e bloqueada para revisao. Nomes iguais
nao sao fundidos automaticamente; clientes diferentes podem ter o mesmo nome.

Se fechar ou recarregar a tela depois de uma falha de conexao, confira a lista
antes de iniciar outro cadastro: a chave da tentativa nao persiste no navegador.
O formulario tradicional permanece disponivel; a protecao de repeticao desta
entrega vale para o novo fluxo guiado, que envia a chave de solicitacao.
Isto nao interpreta um pedido em linguagem livre nem envia mensagens ao cliente.

## Testar na hospedagem

1. Revise e cancele um cadastro. Ele nao deve aparecer na lista.
2. Cadastre um nome com contato, confira a revisao e confirme.
3. Abra o cliente e confira os dados e sua disponibilidade na Agenda.
4. Teste tambem o cadastro tradicional e uma segunda conta: os dados nao
   devem aparecer entre contas diferentes.

## Verificacao local

Aplicadas skills de formularios, acessibilidade, React, seguranca e testes de
interface. Build de producao, verificacao de acesso do servidor e 71 testes
automatizados passaram. Tres verificacoes dos SQLs ausentes 005/006/008 foram
excluidas da selecao; os testes das regras correspondentes permanecem.

Browser plugin indisponivel: usado Playwright com Chrome e APIs simuladas,
em 320, 390 e 1440 pixels. Conferidos campos invalidos/foco, normalizacao,
revisao, edicao, cancelamento sem envio, bloqueio durante gravacao, resposta
perdida e repeticao da chave sem novo cadastro. Capturas revisadas visualmente.
As consultas anteriores da Assistente tambem passaram na regressao.

Nao houve acesso ao banco real nem publicacao automatica. O SQL foi revisado,
mas nao executado em MySQL local; teste a importacao e o fluxo na Hostinger.
