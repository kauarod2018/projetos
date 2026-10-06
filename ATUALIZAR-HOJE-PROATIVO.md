# Hoje: resumo proativo

Pacote cumulativo: `vemo-hoje-proativo.tar.gz`.
Mantem Next.js 16.3.6 e os fluxos anteriores da Assistente.

## Publicar

1. Guarde backup do banco e da implantacao atual.
2. Nao ha SQL novo. Se as migracoes anteriores ate 008 ja foram aplicadas,
   basta atualizar o aplicativo. Nao repita migracoes nem importe schema.sql
   sobre o banco existente.
3. Envie o pacote na mesma aplicacao Next.js da Hostinger, com raiz `/`,
   npm run build e npm start. Preserve as variaveis de banco, APP_URL e email.
   Nenhuma chave de IA nova e necessaria.

Os SQLs 005/006/007/008 foram removidos da pasta local anteriormente e nao
foram recriados. Se faltar alguma etapa, consulte os pacotes anteriores.

## O que mudou

O Hoje apresenta "Seu dia com a Vemo": proximo atendimento ou horario em
curso, valores a receber e o retorno mais antigo elegivel de orcamento.
Os dados reutilizam as consultas existentes, sem uma segunda busca do resumo.

Agendar atendimento e Registrar recebimento abrem os fluxos guiados da
Assistente. Preparar retorno abre uma mensagem para revisao; nao envia nada.
Quando nao ha valores a receber, o atalho oferece a consulta de entradas do mes.

O dia, a saudacao e os calculos do Hoje usam Brasilia, inclusive quando o
dispositivo estiver em outro fuso. Horario em curso indica apenas a janela
prevista, nao comprova que o prestador iniciou o servico.

Valores a receber nao sao saldo bancario nem prova de atraso. Retornos
consideram orcamentos enviados ainda validos, sem resposta ha pelo menos
tres dias. Falhas de agenda e orcamentos aparecem separadamente, sem um
zero falso. O botao Atualizar resumo permite consultar novamente.

Esta entrega usa regras fixas: nao interpreta conversa livre, envia mensagens,
monitora em segundo plano ou executa mudancas sem confirmacao.

## Conferir no site publicado

1. Abra Hoje e compare o resumo com Agenda e Orcamentos.
2. Use Agendar atendimento, revise e cancele; nada deve ser salvo.
3. Use Registrar recebimento e confira o orcamento antes de confirmar.
4. Prepare um retorno e confira o texto. Nenhuma mensagem deve ser enviada.
5. Teste no celular e numa segunda conta, sem dados da primeira.

## Verificacao local

Aplicadas as skills de componentes, React, acessibilidade, seguranca e testes
de interface. Build de producao e verificacoes de acesso do servidor passaram.
65 testes automatizados passaram. Tres verificacoes de arquivos SQL ausentes
(005, 006 e 008) foram omitidas; as regras correspondentes continuam cobertas.

Browser plugin indisponivel: usado Playwright com Chrome local e APIs simuladas.
Conferidos 320, 390 e 1440 pixels, capturas visuais, fuso de Toquio com dia de
Brasilia, estados vazios, falhas parciais, atalhos, retorno de foco e ausencia
de gravacoes ao consultar/preparar. As cinco consultas anteriores tambem
passaram nos testes de regressao.

Nao houve acesso ao MySQL real nem publicacao automatica. A verificacao na
Hostinger continua necessaria.
