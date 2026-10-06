# Assistente: agendamento guiado

Pacote cumulativo: `vemo-assistente-agenda.tar.gz`.
Mantem Next.js 16.3.6, consultas e recebimentos da Assistente.

## Publicar

1. Guarde backup do banco e da implantacao atual.
2. Nao ha SQL novo. As etapas anteriores ate o SQL 008 precisam estar
   aplicadas. Se ja estao, nao repita migracoes. Nao importe schema.sql
   sobre o banco existente.
3. Envie este pacote na mesma aplicacao Next.js da Hostinger, mantendo raiz
   `/`, npm run build e npm start. Preserve as variaveis de banco, APP_URL
   e email. Nao e preciso adicionar uma chave de IA.

Os arquivos SQL antigos 005/006/007/008 nao estao mais na pasta local e nao
foram recriados. Caso falte alguma dessas etapas, use os pacotes anteriores.

## Fluxo novo

Abra Assistente > Agendar atendimento. Escolha cliente e, se desejar, um
servico do catalogo. O servico preenche assunto e duracao, que podem ser
ajustados. Cliente, data, horario, duracao e assunto continuam obrigatorios.
Os clientes aparecem com telefone ou numero do cadastro para ajudar a
distinguir nomes iguais.

Revisar agendamento mostra cliente, assunto, inicio, termino e observacoes.
Os horarios sao de Brasilia; se o atendimento atravessar a meia-noite, a
data de termino aparece explicitamente. Voltar e editar preserva os dados
e exige uma nova revisao. Revisar ou cancelar nao grava nenhum compromisso.

Somente Confirmar agendamento envia os dados. O servidor confere a conta,
cliente, servico e conflitos com os compromissos existentes. Depois de salvar,
a Agenda abre no dia escolhido com os dados atualizados. Conclua outros
formularios abertos antes deste fluxo, pois a navegacao recarrega a pagina.

## Falhas e limites

Se houver conflito, volte e escolha outro horario. Se a resposta se perder,
tente novamente com os mesmos dados: a mesma solicitacao nao cria outro
compromisso. Caso o servidor informe que a solicitacao ja foi salva, confira
a Agenda antes de iniciar outro agendamento.

Se os clientes nao carregarem, o envio fica bloqueado e ha uma opcao para
tentar novamente. Sem clientes, o formulario oferece acesso ao cadastro.
Se apenas o catalogo falhar, assunto e duracao podem ser preenchidos manualmente.

Este e um fluxo guiado, nao interpretacao de texto ou audio por IA.
Nao envia WhatsApp, confirma com o cliente, registra pagamento ou cria
recorrencia. A situacao inicial e Agendado, nao Confirmado.
Conflitos consideram a Agenda cadastrada, nao um calendario externo ou
horarios de expediente. A revisao nao reserva nem garante um horario livre.
O formulario original da Agenda continua com seu fluxo habitual.

## Testar na Hostinger

1. Pela Assistente, selecione cliente e servico; confira assunto e duracao.
2. Revise um atendimento que termine no dia seguinte e confira as datas.
3. Volte, altere o horario, revise outra vez e cancele: nada deve ser salvo.
4. Confirme um horario livre e confira o atendimento na Agenda e no cliente.
5. Tente um horario ja ocupado: o sistema deve impedir a duplicacao.
6. Confira nomes de clientes iguais, celular e isolamento entre duas contas.
7. Teste tambem as consultas e o recebimento da Assistente, que permanecem.

Nao houve acesso ao banco real nem publicacao automatica. As verificacoes
na hospedagem continuam necessarias, inclusive para concorrencia real.

## Verificacao local

Aplicadas skills de formularios, acessibilidade, React, componentes,
seguranca e testes de interface. Reutilizados formulario e API da Agenda;
nenhuma nova rota de gravacao ou credencial foi adicionada.

63 testes automatizados passaram com banco simulado. Tres verificacoes de
arquivos SQL ausentes (005, 006 e 008) foram omitidas, preservando as mudancas
locais do usuario. As regras e rotas correspondentes continuam cobertas.

Playwright com Chrome local em 320, 390 e 1440 pixels, com APIs simuladas:
revisao sem gravacao, cliente/servico, validacao, fim no dia seguinte,
cancelamento, retorno para editar, erro de carregamento, conflito, resposta
perdida apos gravar, repeticao sem duplicata e bloqueio durante envio.
Tambem conferidos Agenda original, recebimento guiado e acesso do servidor.
Browser plugin indisponivel; usado Playwright local. Capturas revisadas
visualmente e sem erros inesperados de console no fluxo novo.
Compilacao de producao e testes de acesso do servidor passaram. As cinco
consultas da Assistente tambem foram retestadas. Corrigida a mensagem de
validacao que permanecia no campo depois de ele ser alterado/preenchido
pelo catalogo, com verificacao de regressao no navegador.
