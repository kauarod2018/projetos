# Recebimentos no historico do cliente

Pacote: `vemo-recebimentos-cliente.tar.gz`.
Entrega cumulativa sobre a mesma base de Servicos, Agenda, Historico e
Recebimentos. Nao substitua outra linha do projeto sem comparar o codigo.

## Publicar

1. Guarde backup do banco e da implantacao atual.
2. Esta etapa nao cria outra migracao. Se a 007 ja foi aplicada, nao importe
   SQL novamente. Se ainda nao foi, siga `ATUALIZAR-RECEBIMENTOS.md` e importe
   SOMENTE `database/007-quote-receipts.sql`, uma vez, antes desta publicacao.
   Nunca importe o schema completo em um banco existente.
3. Envie o pacote na mesma aplicacao Node.js da Hostinger. Preserve variaveis,
   Next.js, raiz `/`, `npm run build` e `npm start`.
4. Abra Clientes > Ver historico > Recebimentos.

## Entrega

- Terceira categoria no historico: Recebimentos.
- Valor recebido, data do recebimento, data de cadastro e link do orcamento.
- Somente entradas vinculadas a orcamentos do cliente selecionado.
- Nao associa movimentacoes pelo nome ou por suposicao. Entradas manuais sem
  vinculo continuam em Financas, mas nao aparecem no historico do cliente.
- Ordem de cadastro mais recente, com paginas de ate 20 registros.
  Um pagamento antigo registrado hoje pode aparecer antes de um recente.
- A consulta verifica o dono do cliente, do orcamento E da movimentacao.
- Nenhum registro financeiro e criado ou alterado ao abrir o historico.

## Conferir na hospedagem

1. Registre ou vincule um recebimento em um orcamento de teste. Abra o cliente
   correspondente: ele deve aparecer em Recebimentos com o mesmo valor/data.
2. Abra outro cliente e outra conta. O recebimento nao pode aparecer neles.
3. Uma entrada manual sem vinculo e uma saida nao devem aparecer nessa lista.
4. Abra o link do orcamento e confira o documento correspondente.
5. Com mais de 20 registros, avance/volte e troque a categoria. A nova
   categoria deve comecar na pagina 1, sem misturar os resultados.
6. Confira no celular e em um cliente sem recebimentos.

## Validacao

49 testes automatizados, compilacao e controles de acesso locais verificados.
Testes de consulta usam banco simulado; MySQL real depende da verificacao na
Hostinger. Interface verificada com Playwright, respostas simuladas apenas no
navegador de teste: teclado, paginacao, foco, datas, links, vazio, falha e nova
tentativa em 320, 390 e 1440 pixels. Browser plugin indisponivel nesta sessao.

Skills aplicadas: interacoes/componentes, acessibilidade, React, seguranca e
testes de frontend. Nao foram acessados dados ou credenciais da hospedagem.

Para voltar apenas desta etapa, reimplante `vemo-recebimentos.tar.gz`, sem
remover a coluna quote_id e sem restaurar um banco antigo. Nao volte a versoes
anteriores ao registro de recebimentos: elas podem duplicar totais financeiros.
