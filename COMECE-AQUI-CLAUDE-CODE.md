# Vemo completo para Claude Code

Abra ESTA pasta no Claude Code. package.json esta na raiz; nao precisa buscar
arquivos de outra entrega para desenvolver o site.

## Conteudo

- app: paginas e APIs Next.js.
- components, hooks e lib: interface, regras, autenticacao e integracoes.
- db: conexao e esquema Drizzle/MySQL.
- database: esquema para banco novo, migracoes e consulta de diagnostico.
- public: imagens, fontes e outros assets do site.
- scripts: testes, verificacao de homologacao e empacotamento Hostinger.
- vendor: implementacoes locais utilizadas pelo projeto; nao remover.
- package.json e package-lock.json: dependencias e comandos.
- .env.example: modelo SEM segredos; credenciais reais nao foram entregues.
- CLAUDE.md e AGENTS.md: instrucoes do projeto para agentes.

Os arquivos de node_modules e .next nao sao codigo-fonte e foram omitidos.
Tambem nao ha copia do banco remoto nem backup com dados de clientes.

## Estado do repasse em 06/10/2026

Codigo-base: entrega Vemo-SaaS-Orcamentos-Financeiro-2026-10-06.
O usuario informou que publicou esse .tar.gz na Hostinger, mas nao executou
as atualizacoes SQL. A captura do cadastro nao mostra Individual/Empresa.
Essa interface e compativel com modo SaaS desativado; precisamos conferir
as variaveis da aplicacao, o banco e eventuais erros reais de publicacao.

Cadastro Empresa e estrutura SaaS existem no codigo. O que esta pendente e
a conferencia/ativacao da instalacao real, nao uma promessa de funcionamento
na hospedagem. Nao ha painel global do dono do SaaS para todas as empresas.

Plano aprovado: R$ 49,90/mes, um mes calendario gratuito para novos negocios,
sem cartao no teste. A cobranca real ainda exige configuracao e verificacao.

## Primeiro trabalho recomendado

1. Leia CLAUDE.md e INSTRUCOES-ENTREGA-HOSTINGER.md.
2. Confira a estrutura do banco com a consulta somente-leitura, antes de SQL de migracao.
3. Confirme backup/restauracao e teste as migracoes pendentes num banco separado.
4. Valide empresas independentes, permissoes de funcionarios e fluxo de e-mail.
5. So depois ative o modo SaaS e libere o cadastro conforme o roteiro de homologacao.

Nao precisa pedir ao usuario senhas no chat. Credenciais devem ser configuradas
privadamente no ambiente correto e nao entrar em arquivos de entrega.

## Desenvolvimento

Use Node compativel com engines de package.json, no minimo 22.13.0.

```text
npm ci
npm run test:unit
npm run typecheck
npm run build
npm run test:runtime
```

Teste interface no computador e celular ao altera-la. Os 159 testes e as
verificacoes visuais descritas em VERIFICACAO.md sao resultados anteriores,
nao testes automaticamente executados nesta nova pasta ou na Hostinger.
Reexecute o que for pertinente depois de qualquer mudanca.

## Entregar para o usuario

```text
node scripts/empacotar-hostinger.mjs
```

Os arquivos saem em entregas/. Entregue o .tar.gz e o respectivo guia e checksum.
SQL de atualizacao deve ter roteiro separado, condicionado ao estado real do banco.
O empacotador NAO publica, nao roda testes e nao executa SQL.
