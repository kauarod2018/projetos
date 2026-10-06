# Atualizacao: despesa por texto na Assistente

Exemplos aceitos:

- `Paguei R$ 80 em material`
- `Registra R$ 80 que paguei por material`
- `Lança uma despesa de R$ 1.234,56 com combustível hoje`

O pedido preenche a descricao e o valor no formulario da Assistente. Confira a
categoria, a data e os demais dados antes de confirmar. A data inicial e hoje
em Brasilia; a categoria inicial e "Outros". O texto nao cria lancamento por
si so e nao vai para um modelo externo.

## Publicacao na Hostinger

Envie `vemo-assistente-despesa-texto.tar.gz` para a aplicacao Node.js existente.
Nao ha SQL novo, dependencias ou variaveis de ambiente nesta atualizacao.
Mantenha as configuracoes atuais. A migracao 010, exigida pelo formulario de
despesas existente, ja deve estar aplicada na base publicada.

## Conferencia recomendada

1. Digite `Paguei R$ 80 em material` na Assistente e confira descricao e valor.
2. Revise categoria e data; cancele e confirme que nada foi registrado.
3. Repita o pedido, confirme uma vez e verifique o lancamento no Financeiro.
4. Experimente `Registra R$ 80 que paguei por material` e confirme que abre
   despesa, nao recebimento.
5. Teste valor malformado, dois valores e `ontem`; devem ser recusados.

A gravacao continua passando pela API autenticada e pela confirmacao existente,
com a mesma chave de repeticao em tentativas de rede do mesmo formulario.
