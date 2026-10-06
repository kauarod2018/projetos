# Atualizacao: agendamento por texto na Assistente

A Assistente reconhece um pedido simples como "Marca a Ana sexta as 14h" e
prepara o formulario de agendamento com nome, proxima ocorrencia do dia da
semana e horario de Brasilia.

## Publicacao na Hostinger

Envie o pacote cumulativo `vemo-assistente-agendamento-texto.tar.gz` para a
mesma aplicacao Node.js. Nao ha SQL novo, dependencia ou variavel de ambiente.

## Como usar

1. Abra a Assistente e informe uma frase com nome, dia da semana e horario,
   por exemplo: "Marca a Ana sexta as 14h".
2. Confira a data completa e o horario de Brasilia que a Vemo interpretou.
3. Confira o cliente. Se houver somente um cadastro com o nome exato, ele fica
   pre-selecionado; se houver homonimos, escolha o cadastro correto.
4. Escolha o servico ou informe o assunto e confira/ajuste a duracao.
5. Revise cliente, inicio e termino; confirme somente se estiver tudo correto.

A palavra "sexta" significa a proxima sexta-feira futura; se hoje for sexta,
sera a da semana seguinte. A duracao sugerida e 60 minutos e fica visivel para
edicao. O servidor verifica conflitos ao confirmar. O pedido nao reserva
horario e nao envia mensagem ao cliente.

## Limites e seguranca

O texto nao e enviado a um modelo externo. A interpretacao apenas preenche o
formulario; nao cria ou altera compromissos. Datas historicas/relativas como
"ontem" e "amanha", multiplos dias, ausencia de horario ou negacao nao sao
interpretados. A busca e a selecao de clientes continuam isoladas pela conta
autenticada. Nenhuma migracao foi adicionada.

## Conferencia recomendada

1. Digite "Marca a Ana sexta as 14h" e confirme a data visivel.
2. Use um nome com dois cadastros iguais e verifique que nenhum e selecionado
   automaticamente.
3. Remova ou deixe o assunto em branco e confira a validacao do formulario.
4. Teste um horario ocupado; a API deve informar conflito e nao criar o evento.
5. Cancele na revisao e confirme que a agenda continua sem alteracao.
