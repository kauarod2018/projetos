# Vemo

## Planos futuros

Decisão dos dois planos (Individual e Empresa) registrada em `PLANOS.md`. Ainda não implementado.

## Atualização mais recente: novo visual (07/10/2026)

Leia `ATUALIZAR-NOVO-VISUAL.md` e `DESIGN.md`. Única migração nova: `database/018-business-logo.sql`.

## Pasta completa para Claude Code

Comece por `COMECE-AQUI-CLAUDE-CODE.md`, `CLAUDE.md` e
`INSTRUCOES-ENTREGA-HOSTINGER.md`. Esta pasta contem todo o codigo do site;
dependencias e build local foram omitidos intencionalmente.
O usuario informou que enviou apenas o .tar.gz a Hostinger, sem importar
atualizacoes SQL. O estado real do banco precisa ser conferido.
Instrucoes historicas abaixo nao comprovam a configuracao atual da hospedagem.

## Atualizacao: orcamentos e financeiro, 06/10/2026

Leia `ATUALIZAR-ORCAMENTOS-FINANCEIRO.md` primeiro. Esta entrega acrescenta
arquivamento/restauracao, correcoes de etapa com feedback, exclusao no detalhe
e tabelas financeiras reorganizadas. Em banco existente que ja usa 016,
aplique apenas `database/017-quote-archive.sql` antes de publicar o novo codigo.
Para instalacao completa e homologacao, leia `VALIDACAO.md`.

## Entrega SaaS: empresas, equipe e teste gratuito

Individual e Empresa agora sao tipos de conta distintos. Empresa acrescenta
cadastro de funcionarios, convites restritos e distribuicao de atendimentos.
Funcionario acessa apenas Meu trabalho, sem financeiro ou lista geral de
clientes. Leia `EMPLOYEES.md`; aplique a migracao 015 apos 013 e 014 em bases
existentes. A troca de tipo nao reinicia o mes gratuito nem a assinatura.

Leia `SAAS.md` antes de ativar esta versao. A nova estrutura usa a migracao
aditiva `013-saas-workspaces.sql` para bancos existentes e fica protegida por
`SAAS_ENABLED=false` ate a validacao. O cadastro SaaS cria um mes gratuito por
empresa; convites nao reiniciam o prazo. O plano aprovado e R$ 49,90/mes.
Checkout, portal e confirmacao de pagamentos estao implementados com o SDK
oficial Stripe, mas desativados. Leia `BILLING.md` e aplique a migracao 014
apos 013 antes de configurar pagamentos. Banco real, conta do provedor e
publicacao ainda nao estao configurados.

O historico abaixo pertence ao pacote de origem. A afirmacao de que uma
migracao anterior foi aplicada nao foi verificada em um banco real nesta
entrega. Nunca importe `schema.sql` sobre uma base com dados.

## Historico: assistente, historico, financeiro e recorrencia

Esta entrega acrescenta interpretacao opcional por API no servidor, trilha de
atividades com reversoes limitadas, contas previstas com parcelas e pagamentos
parciais, vencimentos no Hoje e na Assistente, cancelamento individual de
parcelas e repeticao de compromissos na Agenda. Leia
`LEIA-PRIMEIRO-HOSTINGER.txt` antes de publicar. Para esta atualizacao, nao e
necessario importar SQL: a migracao 012 ja foi aplicada nesta instalacao.
Nunca importe `database/schema.sql` sobre a base que ja contem dados.

Aplicação Next.js restaurada a partir do backup da Hostinger.

## Desenvolvimento local

```bash
npm ci
npm run typecheck
npm run build
npm start
```

Copie apenas os nomes de `.env.example` para a configuração local ou da hospedagem e preencha os valores fora do código-fonte.

Para atualizar, siga [LEIA-PRIMEIRO-HOSTINGER.txt](LEIA-PRIMEIRO-HOSTINGER.txt).
# Atualizacao SaaS de 06/10/2026

Comece por `VALIDACAO.md`: instalacao sem perda de dados, migracao 016, recepcao/funcionarios, agenda por pessoa, relatorios, fluxo de cobranca e roteiro de homologacao. Nao abra cadastros ou cobrancas reais antes de completar esse roteiro.

