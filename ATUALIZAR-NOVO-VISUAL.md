# Atualização: novo visual do Vemo (07/10/2026)

## O que mudou
- **Visual novo em todo o sistema** (guia em `DESIGN.md`): base clara estilo Notion, menu lateral claro, fontes Inter e Plus Jakarta Sans servidas pelo próprio site.
- **Página de apresentação** em `/` para visitantes, com recursos, como funciona, preço, dúvidas e rodapé.
- **Login mudou para `/entrar`**. Quem não estiver logado e abrir uma tela interna vai para `/entrar`.
- **Termos de uso** (`/termos`) e **Política de privacidade** (`/privacidade`): são MODELOS. Preencha razão social, CNPJ, e-mail e cidade e revise com um advogado.
- **Hoje**: interface de IA com saudação por horário, resumo escrito do dia, agenda em linha do tempo, dinheiro, atrasos, funil de orçamentos e sugestões.
- **Financeiro**: cartão de saldo do mês, últimos 6 meses, extrato agrupado por dia, abas Extrato / Contas / Relatórios, formulário com Entrada e Saída.
- **Agenda**: faixa da semana, cartões coloridos por situação, menu de WhatsApp em cada atendimento e painel "Lembretes no WhatsApp" para hoje ou amanhã. O envio continua manual pelo WhatsApp do usuário.
- **Orçamentos**: resumo (aguardando, aprovados, recebidos, taxa de aprovação), filtros rápidos, busca e aviso de validade.
- **Configurações**: reorganizadas por seções e **logo da empresa**, que aparece no orçamento, no PDF e no link público.
- Google: só `/`, `/termos` e `/privacidade` podem ser indexadas. `robots.txt` e `sitemap.xml` foram criados.

## Banco de dados (MySQL da Hostinger)
Apenas UMA atualização nova: `database/018-business-logo.sql`.
- Cria a tabela `business_logos`. Não altera nem apaga nenhum dado existente.
- Faça backup no phpMyAdmin (Exportar) antes.
- Importe o arquivo uma única vez (aba Importar ou cole o conteúdo na aba SQL).
- Não depende de outras tabelas (sem chave estrangeira).
- Se ainda não importar, o site funciona normalmente; apenas o envio de logo mostra erro.

### Banco da Hostinger sem as migrações 013 a 017 (conferido em 07/10/2026)
O diagnóstico (`database/DIAGNOSTICO-COMPLETO-somente-leitura.sql`) mostrou que faltavam as migrações 013 a 017.
Use **`database/ATUALIZAR-BANCO-013-a-017.sql`**: aplica tudo de uma vez, pode ser rodado de novo sem duplicar
e não usa chave estrangeira para as tabelas antigas. Depois, rode o diagnóstico de novo: só devem aparecer as linhas 1-INFO.
Não importe os arquivos 013 a 017 separados nem o `schema.sql`.

## Variáveis de ambiente (painel da Hostinger)
Nada obrigatório mudou. Quando os termos estiverem revisados, para liberar cadastro público no modo SaaS:
```
LEGAL_TERMS_URL=https://vemogestao.com/termos
LEGAL_PRIVACY_URL=https://vemogestao.com/privacidade
```
Mantenha `APP_URL=https://vemogestao.com` (usado também no sitemap).

## Publicar
1. Backup do banco e da pasta atual do site.
2. Envie o novo `.tar.gz` para a mesma aplicação Node.js, como nas entregas anteriores.
3. A Hostinger roda `npm ci`, `npm run build` e `npm start` (há duas dependências novas de fontes).
4. Importe `018-business-logo.sql`.
5. Confira: `/` (apresentação), `/entrar` (login), `/hoje`, `/financas`, `/agenda`, envio da logo em Configurações e um orçamento aberto pelo link público.

## Voltar atrás
Reenvie o `.tar.gz` anterior. A tabela `business_logos` pode ficar no banco; o código antigo simplesmente não a usa.
