# Atualizacao: recebimentos ligados aos orcamentos

Pacote: `vemo-recebimentos.tar.gz`. Continua a base de Servicos, Agenda e
Historico de Clientes desta sequencia. Nao substitua uma versao diferente
com funcionalidades que nao estejam nessa base sem comparar antes.

## Publicar na Hostinger

1. Guarde backup do banco e a implantacao anterior. Confira primeiro em uma
   copia de teste se houver dados reais em uso.
2. A base deve ter as migracoes anteriores, incluindo 006 da Agenda.
3. No phpMyAdmin, importe SOMENTE `database/007-quote-receipts.sql`, uma vez.
   Nao importe `schema.sql` nem os arquivos antigos novamente. Esta migracao
   acrescenta um vinculo opcional e unico entre movimentacao e orcamento,
   sem apagar valores ou mudar status antigos. Se acusar coluna duplicada,
   pare e confira a estrutura; nao exclua a coluna para tentar novamente.
4. Envie `vemo-recebimentos.tar.gz` na mesma aplicacao Node.js da Hostinger.
   Mantenha Next.js, raiz `/`, `npm run build`, `npm start` e as variaveis
   atuais do banco, APP_URL e SMTP. Nenhuma nova chave e necessaria.
5. Execute os testes abaixo com registros de teste antes do uso real.

## Como funciona

- No orcamento aprovado, em andamento ou finalizado, escolha Registrar
  recebimento. A primeira entrega aceita somente quitacao integral positiva.
- Confira valor, cliente e data. Marque a confirmacao somente depois de receber.
- Se ja houver uma entrada manual com o mesmo valor, selecione-a. Isso vincula
  o registro existente sem somar outra entrada e preserva sua descricao/data.
- Se nao houver entrada correspondente, escolha Criar uma nova entrada.
- Orcamento e entrada sao atualizados na mesma transacao. Reenviar a mesma
  confirmacao nao cria uma segunda entrada para esse orcamento.
- O status Pago passa a ser definido pelo recebimento. Orcamentos com entrada
  vinculada nao podem mudar de etapa ou ser excluidos pela aplicacao.
- Nenhum pagamento e verificado no banco, no Pix ou em outro provedor.
- Parcelamento, pagamentos parciais e estornos ainda NAO estao disponiveis.
  Confira os dados antes de confirmar; nao use exclusao SQL para corrigir.

## Atencao aos valores antigos

Antes, Financas somava as entradas manuais e tambem os orcamentos Pago usando
a data da ultima alteracao do documento. Isso podia duplicar valores ou
colocar recebimentos no mes errado. Agora o resumo conta somente movimentos
pela data registrada, assim como o Hoje.

Orcamentos antigos Pago sem entrada vinculada aparecem em um aviso. Eles
continuam pagos, mas nao sao somados como uma segunda entrada presumida.
O resumo historico pode mudar por essa correcao. Nao criamos recebimentos
retroativos automaticamente. Confira cada caso e vincule o movimento que
ja existe; so crie outro se realmente nao havia registro. Entradas manuais
independentes ainda podem duplicar registros por erro humano.

## Testar depois de publicar

1. Crie um orcamento de teste, aprove e registre o recebimento integral.
   Confira o status Pago, a data e uma unica entrada em Financas e no Hoje.
2. Use uma data do mes anterior: o valor deve aparecer naquele mes, nao no
   mes em que o orcamento foi editado ou o link foi renovado.
3. Em outro orcamento de teste, vincule uma entrada ja cadastrada. O total
   financeiro nao deve aumentar novamente.
4. Abra o mesmo orcamento em duas abas antes de confirmar. Confirme os mesmos
   dados nas duas: deve continuar havendo uma unica entrada.
5. Tente mudar a etapa ou excluir um orcamento quitado: deve ser bloqueado.
6. Entre em outra conta: os recebimentos e as entradas da primeira nao podem
   ser consultados nem vinculados. Teste tambem pelo celular.
7. Confira os orcamentos antigos que aparecem no aviso de conciliacao.

## Validacao e limites

48 testes automatizados passaram. Incluem manipuladores reais de API com
banco simulado: autenticacao, origem, propriedade, valores, datas, repeticao,
vinculos indevidos, bloqueios e rollback. Nao equivalem a um teste de locks
concorrentes no MySQL real. A compilacao e os controles de acesso do servidor
local tambem foram verificados. A interface foi testada com Playwright e
respostas simuladas em 320, 390 e 1440 pixels. Browser plugin indisponivel;
usado Playwright local. Nenhum bypass de login ou dado de teste entra no pacote.

Skills aplicadas: formularios, acessibilidade, React, revisao de seguranca e
testes de frontend. Nenhuma credencial ou dado real da Hostinger foi acessado.

## Voltar de versao

Antes de registrar recebimentos novos, e possivel reimplantar o pacote anterior
sem remover a coluna adicional. DEPOIS de criar vinculos, nao volte ao calculo
financeiro antigo: ele somaria as entradas com o status Pago novamente.
Nesse caso, suspenda novos registros e solicite correcao mantendo o banco atual.
Nao restaure um backup antigo sobre registros novos.
