@AGENTS.md

# Vemo: repasse para Claude Code

Leia `COMECE-AQUI-CLAUDE-CODE.md` e `INSTRUCOES-ENTREGA-HOSTINGER.md` antes de trabalhar.
Eles registram o estado atual informado pelo usuario em 06/10/2026.

## Regras de entrega solicitadas pelo usuario

- Trabalhe nesta pasta: ela e a raiz completa do projeto, com package.json.
- Entregue o site para esta instalacao da Hostinger em .tar.gz, nunca apenas em ZIP.
- Inclua todo o codigo e assets, package.json, package-lock.json, scripts e vendor.
- package.json deve ficar na raiz interna do arquivo, sem uma pasta extra por fora.
- Nao inclua node_modules, .next, .git, caches, logs, backups ou credenciais.
- Preserve configuracoes reais na hospedagem. Nao empacote .env nem invente senhas.
- Gere o pacote com `node scripts/empacotar-hostinger.mjs` depois das verificacoes.
- Entregue o caminho do .tar.gz, instrucoes de publicacao e as pendencias separadas.
- O envio do .tar.gz NAO atualiza o banco nem ativa SaaS automaticamente.

## Situacao real conhecida

O usuario informou que publicou o ultimo .tar.gz, mas nao importou atualizacoes SQL.
Nao ha acesso validado a Hostinger, MySQL, SMTP ou Stripe nesta pasta.
A tela publicada nao mostra Individual/Empresa, coerente com SAAS_ENABLED desativado.
O valor efetivo das variaveis e o esquema remoto ainda precisam ser conferidos.

Nao assuma que migracoes antigas foram aplicadas apenas porque algum guia historico diz isso.
Nao rode schema.sql sobre o banco existente. Nao reaplique SQL em bloco.
Primeiro confira o esquema; a consulta `database/VERIFICAR-SaaS-Somente-Leitura.sql`
nao modifica dados. Objetos encontrados nao comprovam migracao completa ou backfill.
Valide backup/restauracao e migracoes pendentes em homologacao antes de producao.
Nunca ative SAAS_ENABLED para apenas fazer aparecer o formulario sem validar o banco.

## Produto aprovado

Individual/Empresa, empresas isoladas, funcionarios com acesso restrito, um mes
calendario gratuito por novo negocio e plano inicial de R$ 49,90/mes.
Mudanca de tipo e convites nao reiniciam o teste. Receber dinheiro exige registro
financeiro; mudar etapa, concluir servico ou arquivar orcamento nao gera pagamento.
Preserve historico financeiro e isolamento de empresas em qualquer mudanca.

Nao transforme cobranca de teste em pagamento real. Os flags de faturamento e
pagamentos reais devem continuar desativados ate configuracao e validacao separadas.
Informe claramente quais testes sao locais/simulados e quais foram feitos no ambiente real.
