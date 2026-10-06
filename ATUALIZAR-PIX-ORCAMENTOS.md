# Atualizacao: Pix nos orcamentos

Esta entrega permite configurar uma chave Pix aleatoria UUID v4 em
Configuracoes e exibir QR Code e Pix Copia e Cola na pagina publica do
orcamento depois que o cliente aprovar um pagamento pelo Pix.

## Publicacao na Hostinger

Envie o pacote cumulativo desta versao para a mesma aplicacao Node.js da
Hostinger. Nao execute um SQL novo nesta base: a coluna
`users.business_profile` ja existe na base que o usuario confirmou. A coluna
tambem esta incluida no schema para instalacoes novas.

## Configurar e conferir

1. Publique a aplicacao atualizada.
2. Entre na Vemo e abra Configuracoes > Recebimento por Pix.
3. Informe a chave aleatoria UUID v4 criada pelo banco, o nome do recebedor
   como aparece no banco e a cidade. Salve.
4. Crie um novo orcamento com forma de pagamento Pix e envie o link ao cliente.
5. Abra o link e aprove o orcamento. A pagina deve mostrar o QR Code e o codigo
   Pix Copia e Cola com o valor total do orcamento.
6. Confira nome e valor no aplicativo do banco antes de confirmar qualquer
   pagamento. Depois, o prestador confirma o recebimento na Vemo.

O BR Code e montado localmente pela aplicacao. A Vemo nao consulta bancos,
nao confirma transacoes e nao muda o status para Pago automaticamente.
Orcamentos sem chave configurada continuam aprovaveis; a pagina orienta o
cliente a confirmar o pagamento diretamente com o prestador.

## Cuidados

- A chave aleatoria e uma chave de recebimento, nao uma senha. Nunca informe
  senha bancaria, token ou codigo de autenticacao.
- Confira se o nome e a cidade estao corretos e se correspondem ao cadastro
  esperado no banco.
- O QR e o valor do orcamento sao exibidos somente para orcamentos em Pix com
  status Aprovado, Em andamento ou Finalizado.
- Esta entrega nao altera o Financeiro nem registra pagamento por si so.
