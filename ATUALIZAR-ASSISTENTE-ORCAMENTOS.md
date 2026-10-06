# Assistente: preparar orcamento

Pacote cumulativo: `vemo-assistente-orcamentos.tar.gz`.

## Publicar

Guarde backup e envie o pacote na mesma aplicacao Next.js da Hostinger.
Preserve as variaveis de ambiente, raiz /, npm run build e npm start.
Nao ha SQL novo nem chave de IA. As migracoes anteriores ate 009 precisam
estar aplicadas. Se ja estao, nao as repita. Nao importe schema.sql sobre
o banco existente.

Os SQLs 005/006/007/008/009 nao estao mais na pasta local e nao foram
recriados. Caso falte o 009, ele esta no pacote anterior de cadastro de clientes.

## Fluxo

Abra Assistente > Preparar orcamento. Escolha um cliente e, opcionalmente,
um servico ativo do catalogo. Telefone ou numero do cadastro distingue
clientes com nomes iguais. Revise a selecao e use Continuar no orcamento.

O editor existente abre com o cliente e uma unidade do servico preenchidos.
Confira quantidade, valor, validade, prazo e pagamento antes de salvar.
O catalogo e consultado novamente: o valor exibido na preparacao nao congela
o preco nem garante disponibilidade. Se o servico ficar indisponivel, o editor
avisa e permite escolher outro ou preencher manualmente.

Preparar, revisar, voltar, cancelar ou continuar no editor nao grava um
orcamento e nao cadastra cliente. A gravacao continua no botao de salvar do
editor. Nao ha envio automatico ao WhatsApp, geracao por IA ou nova API.
Finalize outros formularios abertos antes de continuar: a navegacao recarrega
a pagina. A preparacao nao fica salva entre recargas.

Se os clientes nao carregarem, tente novamente. Se apenas o catalogo falhar,
e possivel continuar sem servico e preencher os itens no editor. Sem clientes,
ha um acesso ao cadastro do primeiro contato.

## Conferir na Hostinger

1. Escolha um cliente e servico; revise, volte para editar e cancele.
2. Repita e continue no editor. Confira cliente, descricao, quantidade e valor.
3. Salve somente depois de conferir as condicoes e veja o orcamento criado.
4. Teste sem servico, no celular e em outra conta.

## Verificacoes

Skills aplicadas: formularios, React, acessibilidade, seguranca e testes de
interface. Compilacao de producao, acesso do servidor e 71 testes passaram.
Quatro verificacoes dos SQLs locais ausentes 005/006/008/009 foram excluidas
da selecao. Testes de regras, rotas e falhas do banco continuam incluidos.

Browser plugin indisponivel: usado Playwright com Chrome local e APIs simuladas.
Conferidos 320, 390 e 1440 pixels, capturas visuais, validacao/foco, nomes
duplicados, exclusao de servicos arquivados, edicao/cancelamento, estados vazios,
falha parcial/nova tentativa e passagem para o editor com um unico item.
Nenhuma gravacao ocorreu durante a preparacao. Consultas anteriores tambem
passaram. A primeira tentativa de navegador foi repetida apos concluir o build.

Nao houve acesso ao MySQL real nem publicacao automatica. A gravacao final
do orcamento deve ser conferida na hospedagem com os dados reais de teste.
