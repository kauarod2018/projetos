# Atualizacao: recebimento por texto na Assistente

Esta etapa reconhece pedidos simples de recebimento, por exemplo:
"Registra R$ 180 que recebi do Carlos". A Assistente extrai o nome e o valor
informados, localiza orcamentos elegiveis da conta autenticada com o mesmo
total integral e abre o fluxo de revisao ja existente.

## Publicacao na Hostinger

Envie o pacote cumulativo `vemo-assistente-recebimento-texto.tar.gz` para a
mesma aplicacao Node.js. Nao ha SQL novo nem novas variaveis de ambiente.
Mantenha as configuracoes atuais do banco, do site e do email.

## Como funciona

1. Abra a Assistente e escreva o pedido com valor em reais e nome do cliente.
2. Confira o nome e o valor que a Vemo entendeu.
3. Escolha o orcamento apresentado e confira cliente, numero e total.
4. Confira a data (sugerida como hoje), escolha a entrada financeira
   correspondente ou criar uma nova e confirme que recebeu o valor integral.
5. O recebimento so e salvo depois dessa confirmacao.

O filtro exige o valor integral exato do orcamento. Pagamentos parciais nao
sao baixados por esta etapa. Se nao houver correspondencia, se o pedido estiver
incompleto ou houver ambiguidade, nada sera alterado; confira os dados e use o
fluxo apropriado do Financeiro.

## Protecao e limites

O texto nao e enviado a um servico externo de IA. O navegador envia somente o
nome e o valor interpretados para uma rota autenticada, que consulta apenas a
conta atual. A lista nao escreve dados e a confirmacao continua usando a API
de recebimentos existente, que revalida os dados antes de salvar e evita
duplicar entradas vinculadas.

Este e um primeiro comando estruturado, nao uma conversa livre nem IA
generativa. Nao cria recebimentos, clientes ou orcamentos automaticamente;
nao interpreta datas historicas nesta frase; nao registra parcelas, estornos
ou pagamentos sem um orcamento integral correspondente. A aprovacao de um
orcamento e diferente de confirmar que o dinheiro chegou.

## Conferencia recomendada

1. Pedido com nome e valor exato: confira a busca, revise o orcamento e
   cancele a confirmacao; o Financeiro deve permanecer inalterado.
2. Pedido com valor diferente do total, como pagamento parcial: deve informar
   que nao encontrou correspondencia e nao pode salvar.
3. Nome inexistente ou digitado incorretamente: nenhum dado e alterado.
4. Confirmacao de um orcamento de teste: confira a data, o total, o Financeiro
   e o historico do cliente.
5. Confira tambem a Assistente em outra conta e em uma tela de celular.
