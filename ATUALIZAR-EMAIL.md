# Vemo: recuperacao de senha e confirmacao de e-mail

Esta atualizacao foi preparada localmente. Ela ainda precisa ser instalada na Hostinger.
Nao altera orcamentos, clientes ou financas. Faca backup antes de atualizar.

## 1. Atualizar o banco existente

1. Exporte um backup completo do banco pelo phpMyAdmin.
2. Selecione o mesmo banco que o Vemo ja utiliza.
3. Importe apenas o arquivo atualizacao-email.sql, uma unica vez.
4. Confirme que a importacao terminou sem erros.

NAO importe novamente banco-vemo.sql ou database/schema.sql. Eles sao destinados
a uma instalacao nova, nao a esta atualizacao. Se a importacao falhar, pare e
guarde a mensagem de erro antes de tentar novamente.

A migracao adiciona users.email_verified_at e a tabela account_tokens.
Contas existentes continuam com seus dados e senhas. A migracao nao as marca
como verificadas automaticamente. O codigo novo depende dessa migracao.

## 2. Atualizar o aplicativo

Mantenha as variaveis DB_* e APP_URL atuais. Continue usando:

APP_URL=https://dodgerblue-cormorant-91107.hostingersite.com
EMAIL_VERIFICATION_REQUIRED=false

Envie vemo-email-v2.tar.gz como uma nova implantacao do mesmo aplicativo.
Use Next.js, diretorio raiz / e as configuracoes de compilacao existentes.
Nao substitua o dominio pelo vemo.com: ele nao pertence a este projeto.

Com EMAIL_VERIFICATION_REQUIRED=false, contas existentes continuam entrando.
A recuperacao de senha so envia mensagens depois da configuracao SMTP abaixo.

## 3. Configurar envio de e-mails

Use uma conta ou servico de envio que permita SMTP autenticado. Configure no
painel de variaveis de ambiente da Hostinger, nunca no codigo ou no chat:

- SMTP_HOST: servidor informado pelo servico.
- SMTP_PORT: 465 (TLS direto) ou 587 (STARTTLS obrigatorio).
- SMTP_USER: usuario de autenticacao do servico.
- SMTP_PASSWORD: senha de aplicativo ou credencial SMTP fornecida pelo servico.
- MAIL_FROM: endereco de remetente autorizado pelo servico.

O dominio temporario do site nao cria uma caixa de e-mail. Nao invente um
remetente @vemo.com. As exigencias de verificacao do remetente dependem do servico.
Reimplante/reinicie pelo painel depois de alterar as variaveis.

## 4. Testar antes de exigir confirmacao

Use contas de teste e enderecos de e-mail sob seu controle:

1. Entre com uma conta existente e confira clientes e orcamentos.
2. Solicite confirmacao pelo link Confirmar meu e-mail, abra a mensagem e
   confirme explicitamente. Apenas abrir o link nao altera a conta.
3. Saia e use Esqueci minha senha. Abra o e-mail e defina uma senha nova.
4. Confira que a senha antiga nao entra e a nova entra.
5. Confira que as outras sessoes da conta foram encerradas.
6. Tente reutilizar o link: deve ser recusado. Solicite dois links; apenas o
   ultimo deve funcionar. Verifique tambem a separacao entre contas.
7. Confira mensagens de erro, spam e remetente.

Links de senha duram 30 minutos; de confirmacao, 24 horas. Sao de uso unico.
Somente hashes dos tokens ficam no banco. O token fica no fragmento do link
e e retirado da barra de endereco pela tela; recarregar exige reabrir o e-mail.

Depois de confirmar a entrega e verificar sua propria conta, voce pode definir
EMAIL_VERIFICATION_REQUIRED=true. Isso exigira confirmacao de TODAS as contas,
inclusive as antigas, e impedira o acesso de contas ainda nao verificadas.
Cadastros dependem separadamente de REGISTRATION_ENABLED=true.

## Limites e verificacao

A compilacao, tipos e testes locais nao substituem o teste de entrega SMTP
e das transacoes no MySQL da hospedagem. Esses testes reais ainda sao pendentes.
O envio ocorre apos a resposta HTTP e nao possui fila duravel: se o processo
reiniciar, pode ser necessario solicitar outro link.

Sem politica de proxy confiavel validada, os limites de entrada sao compartilhados:
30 pedidos de e-mail por hora no aplicativo e 3 por endereco/finalidade por hora.
Antes de aumentar o publico, revisar essa politica e adicionar monitoramento.

Logs usam codigos genericos VEMO_ACCOUNT_EMAIL_SEND_FAILED,
VEMO_ACCOUNT_EMAIL_TASK_FAILED e VEMO_PASSWORD_NOTICE_FAILED.
Nao publique senhas, tokens, credenciais ou dados de clientes ao pedir suporte.

Guarde o pacote anterior. Se precisar voltar o codigo, restaure a implantacao
anterior; as colunas e tabela adicionadas podem permanecer. Nao apague dados
nem restaure um backup antigo sem avaliar os registros criados depois dele.
