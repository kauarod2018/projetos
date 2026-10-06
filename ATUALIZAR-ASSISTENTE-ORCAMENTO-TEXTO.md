# Atualizacao: preparar orcamento por texto na Assistente

A caixa de texto reconhece pedidos limitados como:

- `Cria um orcamento de R$ 900 para a Ana`
- `Prepare orcamento de R$ 1.234,56 para Carlos Pereira`

## Publicacao na Hostinger

Envie `vemo-assistente-orcamento-texto.tar.gz` para a aplicacao Node.js que ja
esta publicada. Esta entrega nao adiciona SQL, dependencia nem variavel de
ambiente. Preserve as variaveis atuais configuradas na Hostinger.

## Fluxo

1. A Assistente interpreta um unico valor brasileiro e um nome de cliente.
2. Com um cadastro de nome exatamente igual, ele fica pre-selecionado. Sem
   correspondencia, o nome pode ser cadastrado junto ao orcamento, caso o
   usuario decida salvar. Homonimos exigem selecao manual.
3. O valor preenche um item de quantidade 1, sem descricao. O prestador deve
   descrever o servico e revisar cliente, valor, validade e condicoes.
4. O orcamento so e enviado ou salvo quando o usuario concluir o fluxo normal.

## Limites

Interpretacao deterministica no navegador; o texto nao vai para IA externa. A
Assistente nao cria o orcamento, cliente ou cobranca ao reconhecer a frase, nao
envia WhatsApp e nao confirma pagamento. Valores malformados, ausentes, zero,
mais de um valor, nome ausente, pedidos negados ou nomes compostos por mais de
um cliente nao sao interpretados. A selecao de cadastros usa as APIs existentes,
protegidas pela conta autenticada. Nenhuma migracao foi adicionada.

## Conferencia recomendada

1. Teste `Cria um orçamento de R$ 900 para a Ana` e confira o valor no editor.
2. Verifique que a descricao do item continua obrigatoria antes de salvar.
3. Teste um cliente existente, um novo nome e dois clientes homonimos.
4. Cancele antes de salvar e confirme que nenhum orcamento foi criado.
5. Teste valor malformado e comando negado; ambos devem ser recusados.
