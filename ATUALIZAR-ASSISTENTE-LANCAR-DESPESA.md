# Assistente: registrar uma despesa

Pacote cumulativo: `vemo-assistente-lancar-despesa.tar.gz`.

## Atualizar banco

Antes de enviar o pacote, faca backup do banco e importe uma unica vez
`database/010-transaction-requests.sql` pelo phpMyAdmin na mesma base Vemo.
Esse SQL so adiciona uma coluna opcional e um indice unico por conta para
evitar gravacao repetida quando a confirmacao e reenviada. Os lancamentos
atuais permanecem. Nao rode esse SQL novamente apos sucesso.

Se o SQL mostrar erro, pare e envie a mensagem antes de continuar. Nao importe
`schema.sql` em um banco que ja esta em uso. As migracoes anteriores ate 009
precisam estar aplicadas. Os SQLs 005 a 009 foram retirados da pasta local;
se uma etapa estiver pendente, consulte os pacotes anteriores.

## Publicar aplicacao

Depois da importacao 010 concluir, atualize a mesma aplicacao Next.js na
Hostinger com este pacote. Preserve as variaveis de ambiente, raiz /,
`npm run build` e `npm start`. Nao ha chave de IA nem outra migracao.

## Usar

Na Assistente, escolha **Registrar despesa**, preencha descricao, valor e data,
revise e confirme. A despesa entra no Financeiro da conta autenticada. Em caso
de falha de conexao, a nova tentativa usa a mesma chave e nao cria outro
lancamento. Se a mesma chave chegar com dados diferentes, a API recusa a
solicitacao; confira o Financeiro antes de iniciar outro lancamento.

A criacao continua disponivel no formulario normal de Financas. Essa tela
mantem o fluxo atual sem chave de repeticao. Nao use o mesmo token manualmente
em solicitacoes diferentes.

## Verificacao

Skills aplicadas: seguranca, React/Next.js, acessibilidade e formularios.
Compilacao de producao executada; confira o resultado final junto deste
pacote. Nao houve acesso ao banco real nem publicacao automatica na Hostinger.
