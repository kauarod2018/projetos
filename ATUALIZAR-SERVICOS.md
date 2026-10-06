# Servicos: pacote para teste separado

## Nao substituir o site ativo

Esta entrega usa uma base recuperada anterior a algumas mudancas ja publicadas,
como perfil do negocio e envio de sugestoes. O pacote NAO e uma atualizacao
cumulativa do site atual. Nao enviar para a aplicacao de vemogestao.com.
Podemos continuar o desenvolvimento nesta pasta, mas a publicacao definitiva
exige comparar e reintegrar o codigo atual primeiro.

## O que esta pronto nesta etapa

- Cadastro de nome, descricao, preco em reais e duracao em minutos.
- Busca, edicao, arquivamento com confirmacao e reativacao.
- Selecao de servico no novo orcamento e atalho pelo catalogo.
- Copia de descricao/preco para preservar orcamentos antigos.
- Isolamento por conta e validacao de entradas no servidor.
- Prevencao de cadastro duplicado em tentativas repetidas da mesma solicitacao.
- Edicao com controle de versao para nao sobrescrever outra aba silenciosamente.

Nao inclui Agenda, IA por texto/audio, automacao de WhatsApp nem historico
reversivel. A duracao no catalogo e uma estimativa, nao um agendamento.

## Testar na Hostinger sem mexer na producao

1. Use uma aplicacao Node.js separada, com dominio temporario e banco de teste
   independente. Nao reutilize as credenciais nem o banco de producao.
2. Envie `vemo-servicos-SOMENTE-TESTE.tar.gz` para essa aplicacao separada.
   Framework Next.js, raiz `/`, Node >=22.13, compilacao `npm run build`,
   inicializacao `npm start`. O arquivo contem o codigo, nao `node_modules`.
3. Em um banco de teste VAZIO, importe `database/schema.sql`. Esse arquivo ja
   inclui a tabela de servicos. Nao importe o schema completo em banco existente.
4. Se o banco de teste JA tem as tabelas desta base, importe somente
   `database/005-service-catalog.sql`. Confira antes se `services` ja existe:
   `IF NOT EXISTS` nao verifica a estrutura de uma tabela antiga homonima.
   A migracao somente acrescenta a tabela, nao apaga dados existentes.
5. Configure as variaveis com base em `.env.example` no painel da aplicacao.
   `APP_URL` deve ser a URL HTTPS do ambiente de teste. Preencha as credenciais
   do banco isolado. Nunca use prefixo `NEXT_PUBLIC_` para senhas.
6. Para criar contas de teste, habilite `REGISTRATION_ENABLED=true` somente
   enquanto necessario. Nao enfraqueca as configuracoes do site publicado.
7. Crie um servico, atualize a pagina e confira a persistencia. Edite o preco;
   crie um orcamento; mude novamente o preco do catalogo e confirme que o
   documento salvo nao mudou. Teste arquivar, cancelar e reativar.
8. Use outra conta e confirme que nao ve nem altera os servicos da primeira.
   Em duas abas, tente salvar uma edicao antiga depois de outra mais recente:
   deve aparecer um aviso, sem sobrescrever a versao mais nova.

Os arquivos de credenciais, dados reais, backups e capturas de teste nao estao
no pacote. Nao envie senhas no chat. A numeracao 005 identifica este arquivo;
nao importa automaticamente migracoes antigas ou modifica o perfil do negocio.

## Limites da verificacao

Passaram 27 testes automatizados, a compilacao de producao e os testes de
acesso anonimo/origem das APIs no servidor. Os testes de consultas autenticadas
usam um banco simulado com SQL real compilado, nao uma instancia MySQL.
Os testes de interface usam respostas simuladas apenas no navegador de teste.
Persistencia real, concorrencia MySQL e entrega de email precisam ser testadas
no ambiente separado antes de qualquer publicacao definitiva.
