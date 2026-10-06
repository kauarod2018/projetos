# Atualizacao: clientes e orcamentos

Pacote local; nenhuma alteracao foi publicada automaticamente.

## Antes de publicar

1. Faca backup do banco e guarde o pacote atualmente implantado.
2. Durante uma janela sem uso do aplicativo, aplique database/002-account-email.sql
   SOMENTE se a atualizacao de e-mail ainda nao foi aplicada.
3. Aplique database/003-quote-editing.sql uma unica vez. Ela adiciona uma coluna
   e copia os dados atuais dos clientes para os orcamentos existentes.
4. Publique o novo pacote vemo-edicao-v3.tar.gz no mesmo aplicativo Next.js.
5. Use APP_URL=https://vemogestao.com (ou a origem canonica exata caso use www).
   Mantenha DB_* existentes e EMAIL_VERIFICATION_REQUIRED=false enquanto
   nao houver envio de e-mails configurado e testado.

Nao reimporte database/schema.sql em um banco existente.
Se qualquer migracao falhar, pare antes de publicar e confira o erro.
Dados historicos alterados antes desta migracao nao podem ser reconstruidos:
o preenchimento inicial usa os dados de cliente existentes naquele momento.

## Comportamento

- Editar cliente altera o cadastro, sem modificar os dados gravados nos orcamentos.
- Editar rascunho, enviado ou recusado salva os dados atuais do cliente escolhido.
- Orcamentos ja aprovados ou em andamento/finalizados/pagos nao podem ter o
  conteudo editado. Uma aprovacao registrada continua protegendo o documento
  mesmo se o status for alterado depois.
- Salvar uma edicao volta o documento a Rascunho e invalida o link antigo.
- Edicoes em duas janelas sao detectadas pelo token original; reabra a tela
  quando aparecer aviso de conflito.
- Duplicar / Criar nova versao abre um formulario preenchido. So salva quando
  confirmado, criando outro numero, link e aprovacao independente. O original
  permanece. Nao existe historico formal de revisoes vinculadas nesta etapa.
- A duplicacao usa o cadastro atual do cliente ao salvar e validade nova de 7 dias.

## Validacao antes do lancamento

Typecheck, build e testes locais nao substituem testes com MySQL real.
Em contas de teste, conferir: edicao de cliente; preservacao de documento
aprovado; edicao de itens/desconto; link antigo invalidado; duplicacao com
novo numero; aprovacao concorrente com edicao; rejeicao de acesso entre contas.
Verifique tambem o formulario em celular e mensagens de erro.
SMTP permanece pendente e nao e necessario para essas edicoes.
