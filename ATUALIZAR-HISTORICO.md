# Atualizacao: historico do cliente

Pacote: `vemo-historico-clientes.tar.gz`. Continua a mesma base de Servicos e
Agenda entregue anteriormente; nao recupera funcionalidades de outras versoes.

## Publicar

1. Guarde um backup atual e mantenha a implantacao anterior disponivel.
2. Se ainda nao aplicou `database/006-appointments.sql`, conclua a etapa Agenda
   seguindo `ATUALIZAR-AGENDA.md`. Se ja aplicou, nao importe SQL novamente:
   esta entrega nao tem nova migracao. Nunca importe o schema completo em um
   banco existente.
3. Envie o pacote na mesma aplicacao Node.js da Hostinger. Preserve APP_URL,
   credenciais do banco e SMTP. Mantenha Next.js, raiz `/`, `npm run build` e
   `npm start`. Nenhuma nova variavel ou integracao externa e necessaria.
4. Acesse Clientes e clique em Ver historico. Confira os testes abaixo.

## Entregue

- Pagina individual em `/clientes/ID` com contato e observacoes do cadastro.
- Orcamentos e atendimentos separados, incluindo cancelados.
- Valores dos orcamentos calculados como no documento, por item e desconto.
- Paginas de ate 20 registros, ordenadas do cadastro mais recente ao mais antigo.
- Atalhos Novo orcamento e Agendar ja selecionam o cliente.
- Ver dia na agenda abre a data do atendimento selecionado.
- Isolamento por conta E cliente nas consultas, sem expor tokens publicos.
- Carregamento, falha com nova tentativa, cliente inexistente e lista vazia.
- Foco de teclado preservado no resultado apos trocar paginas.

Este historico mostra a situacao ATUAL de cada registro. Nao e um historico de
mudancas de status, auditoria de operacoes ou extrato financeiro. Aprovado nao
significa recebido; nenhum pagamento e registrado por abrir esta tela.

## Conferir depois de publicar

1. Abra dois clientes diferentes e confira que os registros nao se misturam.
2. Confira contato, observacoes, status e totais com os documentos originais.
3. Use Novo orcamento e Agendar: o cliente deve vir selecionado, sem salvar nada
   automaticamente. Cancele o formulario para sair sem criar registros.
4. Na lista de atendimentos, abra Ver dia na agenda e confira a data.
5. Com mais de 20 registros, avance e volte de pagina. Mude a categoria e
   confira que ela retorna a primeira pagina.
6. Teste uma conta diferente e um cliente inexistente: os dados privados nao
   podem aparecer. Confira tambem pelo celular.

## Validacao

40 testes automatizados passaram, incluindo autenticacao, escopo das consultas,
cursores, arredondamento fracionado, desconto e respostas sem segredos.
Compilacao e protecao das APIs foram verificadas no servidor de producao local.
Interface conferida com Playwright em 320, 390 e 1440 pixels, com respostas de
API simuladas exclusivamente no navegador de teste. Nao ha bypass de login no
produto. MySQL real e funcionamento publicado ainda dependem da verificacao na
hospedagem. Nenhum dado da Hostinger foi acessado ou alterado nesta etapa.

Se precisar voltar, reimplante o pacote anterior da Agenda, sem restaurar um
banco antigo e sem apagar registros.
