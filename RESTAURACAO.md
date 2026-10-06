# Restauração do Vemo na Hostinger

Este pacote contém o código-fonte recuperado do backup de `vemogestao.com`, revisado e testado localmente. O banco de dados continua no arquivo original separado; dados reais e credenciais não foram copiados para este projeto.

## Backups conferidos

- Site: `u593140884.20260926173229.tar.gz`
  - SHA-256: `9C8F97C042811B097782537CE2C5655D8B6C41041C5ECF3D1DBFBCEA6285EDCF`
- Banco: `u593140884_vemo.20260926173229.sql.gz`
  - SHA-256: `54EA528903C853A39EEDF2D0FB95726EC36121265C76EF4B9187E8B99DABA455`

Guarde esses dois arquivos originais sem modificá-los. Eles são a referência para uma nova tentativa de recuperação.

## Escopo fechado

O objetivo desta restauração é recuperar a mesma aplicação, preservar o banco existente, corrigir problemas claros de acessibilidade, desempenho e segurança, e entregar um pacote publicável.

Faz parte deste pacote:

- código Next.js recuperado e compilável;
- experiência de acesso, cadastro, clientes, orçamentos e finanças;
- proteção de sessão, validações e cabeçalhos de segurança;
- instruções para importar o banco completo e configurar a aplicação.

Não faz parte da restauração automática:

- entrar na conta da Hostinger ou alterar o site ativo sem autorização;
- inventar ou reutilizar senhas de banco e SMTP;
- reescrever o produto ou substituir dados reais por dados novos;
- prometer funcionamento do banco, SMTP ou domínio antes do teste no ambiente da Hostinger.

O circuito de segurança é simples: se a importação do banco, a compilação ou o teste de acesso falhar, pare. Não apague a instalação anterior e não faça a troca do domínio até o erro ser entendido.

## Ordem recomendada

### 1. Preserve o que está online

1. No hPanel, gere um backup atual do site e do banco antes de qualquer mudança.
2. Não apague a aplicação atual.
3. Faça a restauração primeiro em uma aplicação ou domínio temporário.

### 2. Crie um banco vazio

1. Abra **Sites > Painel > Bancos de dados > Gerenciamento**.
2. Crie um banco MySQL novo, com usuário e senha fortes.
3. Abra o phpMyAdmin desse banco.
4. Confirme que ele está vazio.
5. Na aba **Importar**, selecione `u593140884_vemo.20260926173229.sql.gz` e inicie a importação.
6. Se o phpMyAdmin não aceitar o `.gz`, extraia somente esse arquivo para obter o `.sql` e tente novamente.
7. Ao terminar, confirme a presença das oito tabelas: `account_tokens`, `customers`, `login_attempts`, `quote_items`, `quotes`, `sessions`, `transactions` e `users`.

O procedimento oficial da Hostinger está em:
https://support.hostinger.com/en/articles/1864324-how-to-upload-and-set-up-your-database-at-hostinger

Não importe `database/schema.sql`, `database/002-account-email.sql` ou `database/003-quote-editing.sql` depois do backup completo. O arquivo `.sql.gz` já representa o banco restaurado; aplicar os outros arquivos pode duplicar estruturas ou falhar.

### 3. Publique o código em uma aplicação Node.js

Use uma aplicação Node.js compatível com Next.js, como a instalação original. A versão mínima é Node.js 22.13.

Configuração do projeto:

- diretório raiz: `/`;
- instalação: `npm ci`;
- compilação: `npm run build`;
- inicialização: `npm start`;
- porta: a porta fornecida pela hospedagem por variável de ambiente.

Se o seu plano não oferecer uma aplicação Node.js, não envie estes arquivos para um site PHP/HTML comum: esta aplicação usa servidor Next.js e MySQL. Nesse caso, use o recurso Node.js já associado ao site original ou um VPS Node.js.

### 4. Configure as variáveis

Cadastre no painel da aplicação, nunca em arquivos públicos:

```text
APP_URL=https://seu-dominio-temporario-ou-final
DB_HOST=host-informado-pela-hostinger
DB_PORT=3306
DB_NAME=nome-do-banco
DB_USER=usuario-do-banco
DB_PASSWORD=senha-do-banco
DB_SSL=false
REGISTRATION_ENABLED=false
EMAIL_VERIFICATION_REQUIRED=false
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=
```

Use `DB_SSL=true` somente quando a conexão remota exigir TLS. Em produção, `APP_URL` precisa começar com `https://`.

### 5. Teste antes da troca

1. Abra a tela de acesso no domínio temporário.
2. Entre com uma conta existente.
3. Confira clientes, orçamentos, itens e finanças.
4. Crie um cliente e um orçamento de teste; confirme que aparecem após atualizar a página.
5. Abra um link público de orçamento em janela anônima e teste aprovação ou recusa apenas com dados de teste.
6. Saia e confirme que as páginas privadas deixam de abrir.
7. Verifique celular e computador.
8. Somente depois desses testes associe `vemogestao.com` à nova aplicação e atualize `APP_URL` para `https://vemogestao.com`.

Mantenha `REGISTRATION_ENABLED=false` enquanto não precisar criar novas contas. Mantenha `EMAIL_VERIFICATION_REQUIRED=false` até configurar e testar o SMTP com um endereço sob seu controle.

## Volta segura

Se houver erro depois da publicação, a volta é trocar o domínio para a implantação anterior. Não restaure um banco antigo por cima do banco novo sem antes avaliar dados criados após a restauração. Preserve o backup anterior, o novo backup e os registros de erro.
