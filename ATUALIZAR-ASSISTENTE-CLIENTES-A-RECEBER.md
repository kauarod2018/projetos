# Atualizacao: clientes com valores a receber na Assistente

A Assistente responde a "Quem esta me devendo?" e oferece o botao "Clientes com
valores a receber". A resposta agrupa por cadastro os orcamentos aprovados, em
andamento ou finalizados que ainda nao foram marcados como pagos.

## Publicacao na Hostinger

Envie `vemo-assistente-clientes-a-receber.tar.gz` para a aplicacao Node.js
existente. Nao ha SQL novo, dependencia adicional ou variavel de ambiente.
Preserve as configuracoes atuais da Hostinger.

## Como conferir

1. Abra a Assistente e digite "Quem esta me devendo?" ou use o novo botao.
2. Compare o total com os orcamentos aceitos ainda nao quitados.
3. Abra um cliente da lista e confira seu historico. Cadastros com o mesmo
   nome devem aparecer separados.
4. Marque um orcamento como pago pelo fluxo existente, atualize a consulta e
   confira a reducao do valor.

A lista mostra ate dez clientes, ordenados pelo maior valor. O total considera
todos os clientes com orcamentos nessa situacao. A resposta nao verifica o
banco, nao classifica atraso e nao envia cobranca. Os dados sao consultados
pela conta autenticada; nenhuma mudanca e feita ao consultar.
