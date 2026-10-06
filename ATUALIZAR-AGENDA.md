# Atualizacao: Agenda

Esta entrega continua o pacote de Servicos que voce informou ter publicado e
testado. Nao e uma recuperacao de funcionalidades de outras versoes do Vemo.
Use somente sobre essa mesma linha de codigo. Antes de atualizar, mantenha um
backup atual dos arquivos, das variaveis e do banco, e a implantacao anterior.

## Ordem da atualizacao

1. No phpMyAdmin, selecione o banco usado pela aplicacao que voce testou.
2. Importe SOMENTE `database/006-appointments.sql`. A tabela `services` da
   etapa anterior precisa existir. Nao importe `database/schema.sql` sobre
   seu banco existente e nao reaplique migracoes antigas.
3. Confirme que a importacao terminou sem erros e que `appointments` existe.
   O script apenas cria essa tabela; nao apaga ou altera dados das anteriores.
   Se uma tabela `appointments` ja existir com outra estrutura, pare e confira:
   `IF NOT EXISTS` nao verifica a compatibilidade de estruturas preexistentes.
4. Envie `vemo-agenda.tar.gz` como nova implantacao da mesma aplicacao Node.js,
   preservando as variaveis atuais, inclusive APP_URL, banco e SMTP.
   Nao substitua senhas por valores do arquivo `.env.example`.
5. Mantenha Next.js, raiz `/`, `npm run build` e `npm start`, como no pacote
   anterior. Esta etapa nao exige nova variavel de ambiente ou servico externo.
6. Abra Agenda e execute os testes abaixo. Em caso de erro de compilacao ou
   migracao, preserve a implantacao anterior e envie a mensagem de erro sem
   senhas. Nao restaure um banco antigo para desfazer uma atualizacao do codigo.

## Funcionalidades

- Visualizacao por dia ou pelos proximos sete dias, ordenada por horario.
- Cliente obrigatorio e servico opcional; o catalogo preenche titulo e duracao.
- Duracao editavel de 1 a 1.440 minutos; observacoes opcionais.
- Todos os horarios desta etapa usam Brasilia (America/Sao_Paulo),
  independentemente do fuso do computador ou do servidor.
- Edicao e remarcacao; filtros por situacao.
- Agendado, Confirmado, Em atendimento, Concluido e Cancelado.
- Toda mudanca de situacao exige confirmacao. Cancelar preserva o registro e
  libera o horario. Reabrir confere a disponibilidade novamente.
- Concluir NAO registra pagamento, receita nem altera orcamentos.
- O Hoje mostra os atendimentos do dia, excluindo cancelados; compromissos
  iniciados no dia anterior aparecem quando ainda cruzam o periodo de hoje.
- Falhas de consulta aparecem como erro, nunca como agenda vazia.

## Testes apos publicar

1. Agende um cliente com um servico, confira a duracao, salve e recarregue a
   pagina. Confirme que o compromisso continua salvo e aparece em Hoje.
2. Tente agendar no mesmo horario: deve bloquear sem duplicar. Um compromisso
   pode comecar exatamente quando o anterior termina.
3. Edite horario/observacoes e confira novamente apos recarregar.
4. Abra uma edicao em duas abas. Salve a primeira e tente salvar a segunda:
   ela deve avisar sobre a versao desatualizada.
5. Cancele, primeiro escolhendo Voltar (nao deve gravar), depois confirmando.
   Confira o registro cancelado e que ele nao aparece nos atendimentos de Hoje.
6. Ocupe o horario liberado e tente reabrir o compromisso antigo: deve bloquear.
7. Conclua um atendimento e confira que o financeiro permanece inalterado.
8. Entre em outra conta: os compromissos e referencias nao podem se misturar.
9. Confira o formulario, os filtros e a troca de dias no celular.

## Verificacao feita localmente

36 testes automatizados passaram, incluindo os handlers reais executados com
banco simulado e consultas Drizzle compiladas. Tambem passaram a compilacao,
as verificacoes de autenticacao/origem no servidor e as interacoes visuais em
320, 390 e 1440 pixels usando Playwright com APIs simuladas no navegador.
Nao ha bypass de login no produto; fixtures e imagens nao entram no pacote.

Persistencia e concorrencia em uma instancia MySQL real ainda precisam dos
testes acima. Esta entrega usa bloqueio por conta dentro da transacao para
serializar alteracoes na agenda, versoes para edicao e chave unica por
solicitacao para evitar repeticao de cadastro.

## Fora desta etapa

Recorrencia, horarios de expediente, varios profissionais, feriados, lembretes,
integracao com calendarios externos, WhatsApp automatico, IA e recebimentos
automaticos. O agendamento manual ja funciona sem essas integracoes.

## Volta ao codigo anterior

Se precisar, volte apenas para a implantacao anterior de Servicos. A tabela
appointments pode permanecer; nao a exclua nem restaure o banco antigo, para
nao perder compromissos ou outros dados criados depois do backup.
