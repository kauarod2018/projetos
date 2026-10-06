# Como entregar o Vemo para a Hostinger

Este documento orienta o Claude Code e registra o formato pedido pelo usuario.
A instalacao dele recebe o site em .tar.gz. Nao substitua a entrega por ZIP,
HTML isolado, build de Windows ou apenas arquivos alterados.

## Pacote completo

Entregue codigo-fonte completo, dependencias declaradas no package-lock.json,
assets de public, scripts e vendor. A Hostinger instala e compila o projeto.
package.json deve estar na raiz interna do tar.gz, como ./package.json.
Nao coloque o projeto dentro de outra pasta interna que exija trocar a raiz.

Nao inclua node_modules, .next, .git, entregas anteriores, caches, logs,
arquivos de ambiente com valores reais, senhas, backups ou dados de clientes.
.env.example pode entrar apenas com placeholders, nunca credenciais reais.
Nao remova imagens/fontes ou vendor para reduzir o tamanho do arquivo.

## Verificar antes de entregar

1. Preserve mudancas do usuario e mantenha o escopo solicitado.
2. Use npm ci e a versao de Node compativel com package.json.
3. Rode testes pertinentes, typecheck, build e test:runtime em ambiente isolado.
4. Para UI, confira fluxos, estados de erro, celular e desktop em navegador real.
5. Confira permissoes e isolamento de empresas se alterar regras compartilhadas.
6. Informe resultados reais e o que nao foi verificado. Nao prometa ausencia total de erros.
7. Atualize o guia de mudancas e de instalacao se houver SQL ou novas configuracoes.
8. Revise segredos antes do empacotamento. Um filtro por nome nao detecta senhas dentro de codigo.

## Gerar e conferir o arquivo

Na raiz desta pasta:

```text
node scripts/empacotar-hostinger.mjs
```

Requer Node e o comando tar no ambiente do Claude Code. Usa ferramentas locais,
nao precisa acessar a Hostinger. Cria um nome unico dentro de entregas/ com:

- Vemo-Hostinger-<data-hora>-<id>.tar.gz: site completo para upload.
- mesmo nome com .sha256: checksum SHA-256 do pacote.
- mesmo nome com .manifesto.json: arquivos incluidos e seus hashes.
- mesmo nome com .LEIA-ME.md: instrucoes basicas de publicacao e alertas.

O empacotador cria um staging temporario, exclui artefatos locais e confere
os caminhos internos do arquivo. Nao executa testes, SQL, deploy ou verificacoes
de funcionamento remoto. Revise a listagem e o manifesto da entrega final.
Nao empacote a pasta entregas dentro de uma nova entrega.

## Publicacao do site

Atualize a MESMA aplicacao Node.js/Next.js usada pelo Vemo, mantendo o banco
e as variaveis privadas existentes. Nao transforme a aplicacao em site PHP/HTML.
Respeite a configuracao existente do painel e a porta fornecida pela hospedagem.
Confirme os ajustes atuais antes de mudar qualquer opcao de publicacao.

Configuracao do projeto: raiz /, instalacao npm ci, build npm run build e
inicializacao npm start, quando esses campos forem apresentados pela hospedagem.
Use versao de Node que satisfaca engines do package.json.

Aguarde a compilacao e a implantacao terminarem. Teste login existente, clientes,
orcamentos, financeiro e rotas publicas no dominio real. Teste novas escritas
somente com dados autorizados, preferencialmente em homologacao.
Se falhar, investigue sem apagar a aplicacao ou restaurar backup antigo sobre
dados novos. Preserve logs sem tokens, senhas ou dados pessoais.

## Banco: separado do tar.gz

O usuario informou que publicou apenas o pacote do site. Nenhuma migracao
remota foi confirmada neste repasse. Documentos historicos que dizem que 012
ou outro arquivo ja foi aplicado nao servem como evidencia do banco atual.

Use database/VERIFICAR-SaaS-Somente-Leitura.sql para triagem. Ele faz apenas
SELECT sobre metadados; ENCONTRADO nao comprova backfill, tipos, indices ou FKs.
Complete essa conferencia antes de escolher SQL para executar.

Para banco EXISTENTE: faca backup, teste restauracao em banco separado, confira
quais migracoes faltam e execute somente as pendentes em ordem, primeiro em
homologacao. Inspecione falhas parciais antes de repetir um arquivo; DDL MySQL
nao e uma transacao atomica. SQL 012 depende de etapas anteriores que nao estao
todas disponiveis como migracoes neste pacote: se faltarem, pare e investigue.

Para banco NOVO E VAZIO: schema.sql cria o esquema completo. Nao rode as mesmas
migracoes depois dele. NUNCA importe schema.sql por cima do banco existente.
O arquivo de verificacao nao e migracao e nao integra a ordem de atualizacao.

Se houver nova migracao, entregue o .sql avulso e diga exatamente os requisitos,
ordem, impacto, backup, testes, verificacao e passos de recuperacao. Nao una
todos os SQL existentes num arquivo para o usuario importar sem diagnostico.

## Cadastro Empresa e cobranca

SAAS_ENABLED=true disponibiliza Individual/Empresa, mas exige as tabelas e
contas antigas corretamente migradas. REGISTRATION_ENABLED=true libera novas
contas e e uma configuracao separada. Nao ative nenhum deles apenas para tirar
um aviso visual ou antes da homologacao.

O cadastro publico SaaS exige LEGAL_TERMS_URL e LEGAL_PRIVACY_URL HTTPS.
Configure e valide APP_URL HTTPS, SMTP e EMAIL_VERIFICATION_REQUIRED antes
de abrir a validacao publica. Teste convites, verificacao e recuperacao de senha.
Nao invente documentos legais nem URLs que nao existem.

BILLING_ENABLED e LIVE_PAYMENTS_ENABLED permanecem false ate testes separados
de pagamento. Nao mude preco ou prazo gratuito aprovado pelo usuario sem pedir.
Nao use SAAS_ENABLED=false depois do onboarding para contornar assinatura.

## Resposta de entrega ao usuario

Apresente de forma simples:

1. Link/caminho do .tar.gz completo.
2. Resumo das mudancas e resultados dos testes realmente executados.
3. Se precisa SQL: arquivo e roteiro separado; se nao precisa, diga explicitamente.
4. Variaveis que precisam mudar, sem revelar valores privados.
5. O que continua pendente na Hostinger; nao diga que publicou se apenas gerou o pacote.

Para este repasse, nenhum acesso ao banco, SMTP, Stripe ou painel Hostinger foi validado.
