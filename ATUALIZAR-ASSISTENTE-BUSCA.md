# Assistente: buscar clientes

Pacote cumulativo: `vemo-assistente-busca.tar.gz`.

## Publicar

Guarde backup e atualize a mesma aplicacao Next.js na Hostinger com este
pacote. Preserve as variaveis de ambiente, raiz /, npm run build e npm start.
Nao ha SQL novo nem chave de IA. As migracoes anteriores ate 009 devem estar
aplicadas; nao repita migracoes nem importe schema.sql no banco existente.
Os SQLs 005/006/007/008/009 nao estao mais na pasta local. Se faltar alguma
etapa, consulte os pacotes anteriores, sem recriar tabelas existentes.

## O que testar

1. Abra Assistente > Buscar cliente. Pesquise por nome, telefone ou email.
2. Experimente nomes com e sem acento e telefone sem parenteses ou hifen.
3. Confira cadastro e contato para distinguir pessoas com o mesmo nome.
4. Use Ver historico ou Novo orcamento e confira o cliente da tela aberta.
5. Teste Limpar busca, Atualizar clientes e Mostrar mais clientes.

O resultado mostra dez registros por vez. Mostrar mais acrescenta dez;
nao e uma paginacao no banco. A API existente carrega os clientes da conta,
e a pesquisa filtra essa lista no navegador, somente ao confirmar a busca.
O texto digitado nao e enviado como consulta ao servidor nem salvo por este
recurso. Nome, telefone e email sao pesquisaveis; observacoes e endereco nao.

Os atalhos apenas navegam. Nao criam cliente, orcamento ou pagamento e nao
enviam WhatsApp. Conclua outros formularios antes de sair da pagina; a
navegacao recarrega a tela. O historico continua consultando os dados reais
da conta no servidor, com as permissoes existentes.

Falhas de carregamento nao sao mostradas como lista vazia. Tentar novamente
e Atualizar clientes consultam os dados outra vez. A busca nao e interpretacao
de linguagem livre por IA e nao faz correspondencia aproximada de nomes.

## Verificacao

Skills aplicadas: formularios, acessibilidade, React, seguranca e testes de
interface. 73 testes automatizados passaram. Quatro verificacoes dos arquivos
SQL ausentes 005/006/008/009 foram excluidas da selecao; testes das regras e
rotas correspondentes permanecem.

Build de producao e verificacao de acesso do servidor passaram. Browser plugin
indisponivel: usado Playwright com Chrome local e APIs simuladas em 320, 390 e
1440 pixels. Conferidos busca por acento/email/telefone, homonimos, dez e mais
resultados, estado vazio, erro/nova tentativa, retorno de foco, links e navegacao
ao orcamento. Nenhuma gravacao ocorreu. As consultas anteriores tambem passaram.
Capturas revisadas visualmente, sem sobreposicoes ou erros de pagina observados.

Nao houve acesso ao banco real nem publicacao automatica. Confira os atalhos
e o isolamento entre suas contas na Hostinger antes de liberar a atualizacao.
