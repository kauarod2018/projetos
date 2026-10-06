# Assistente: consultar despesas

Pacote cumulativo: `vemo-assistente-despesas.tar.gz`.

## Publicar

Guarde backup e atualize a mesma aplicacao Next.js na Hostinger com o pacote.
Preserve as variaveis de ambiente, raiz /, npm run build e npm start.
Nao ha SQL novo nem chave de IA. As migracoes anteriores ate 009 precisam
estar aplicadas. Nao reimporte schema.sql no banco existente nem repita SQLs.
Os SQLs 005/006/007/008/009 foram retirados da pasta local; se alguma etapa
estiver pendente, consulte os pacotes anteriores.

## Usar

Abra Assistente > Saidas do mes, ou pergunte "Quanto gastei este mes?".
O resultado mostra o total e ate dez despesas registradas. Escolha outro mes
no seletor para consultar o historico; meses encerrados usam o mes completo,
e o atual vai ate hoje em Brasilia. A pergunta pelo mes atual e o botao
"Voltar ao mes atual" retornam a consulta ao periodo corrente.

Somente lancamentos do tipo despesa entram no total, com filtro por conta e
periodo. Nenhum dado e alterado. A consulta nao separa despesas por categoria,
nao considera obrigacoes futuras ou atrasadas e nao consulta banco externo.
Mes vazio aparece como total zero acompanhado do aviso de nenhum lancamento.

## Alteracao e verificacao

Skills aplicadas: seguranca, React/Next.js, acessibilidade e testes de interface.
Nao requer alteracao no banco. A compilacao de producao foi iniciada; consulte
o resultado final comunicado junto com o pacote. O banco Hostinger nao foi
acessado e a publicacao nao foi feita automaticamente.
