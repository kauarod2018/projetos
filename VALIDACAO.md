# Vemo: pacote de validacao SaaS

Versao de 06/10/2026. Publico inicial: prestadores de servicos e pequenas equipes de manutencao/instalacao. Este pacote contem o codigo, nao uma conta hospedada nem um banco configurado. Nao inclui senhas, dados de clientes ou chaves de servicos.

## O que foi implementado

- Individual e Empresa; um mes calendario gratuito para novos negocios, sem cartao. Ao expirar, o uso operacional exige assinatura. Preco inicial: R$ 49,90/mes; pagamento real exige ativacao deliberada.
- Funcionarios vinculados a uma empresa e convidados por e-mail verificado. Funcionario ve apenas atendimentos atribuidos, contato/endereco necessarios, instrucoes e seus relatorios. Nao acessa financeiro, orcamentos ou cadastro geral de clientes.
- Recepcao organiza clientes e agenda, consulta relatorios, mas nao acessa financeiro, orcamentos, assinatura ou administracao da equipe. Dono/admin gerenciam acessos; editor tem operacao ampla; leitor nao pode alterar registros. Nao atribua editor a um funcionario que deva ter acesso restrito.
- Agenda por responsavel, atendimentos simultaneos de pessoas diferentes, expediente e ausencias. Trocar responsavel ou reabrir atendimento confere disponibilidade novamente. Historico anterior nao e apagado ao arquivar funcionario.
- Orcamento aprovado inicia agendamento com cliente/assunto preenchidos e permite criar uma unica cobranca vinculada com valor calculado no servidor. Receber essa cobranca integralmente quita a conta prevista e o orcamento com uma unica movimentacao. Concluir atendimento ou salvar relatorio nunca registra pagamento.
- Checklist, ate quatro fotos por atendimento, resumo e proxima manutencao. Fotos sao reduzidas a JPEG no navegador antes do envio. Confirmacao de execucao e um registro manual, nao assinatura digital.
- Relatorio para o cliente por link revogavel de sete dias, sem contatos, notas privadas ou valores. Qualquer pessoa com o link pode consultar; confirme as fotos/resumo antes de compartilhar. Editar o relatorio revoga o link anterior.
- Proximas acoes em Hoje: servicos aprovados sem agenda, atendimento sem responsavel, cobranca a conferir e manutencao a retornar. Lembretes sao sugestoes, nao envio automatico. Consultas muito grandes mostram aviso e nao inferem ausencia de vinculos em dados incompletos.
- Audio/foto vira texto revisavel, com consentimento para envio a IA. O arquivo nao e salvo no banco do Vemo por esse fluxo. Texto revisado apenas preenche o pedido; ainda e necessario interpretar/revisar/confirmar a operacao.
- Cadastro simplificado, navegacao por perfil e ajustes de espacamento, legibilidade e telas menores.

## Instalar sem perder o banco atual

1. Prepare um ambiente separado de homologacao, com HTTPS e MySQL InnoDB. Nao use o banco de producao para esses testes.
2. Faca backup do banco atual e restaure esse backup em outro banco. Confira clientes, orcamentos, recebimentos, vinculos e fotos restauradas. Nao basta existir um arquivo de backup.
3. Banco novo: aplique somente `database/schema.sql`. Banco existente: confira quais migracoes ja foram aplicadas; siga a ordem numerica somente para as pendentes. Se a entrega anterior ja usa 015, aplique 016 e 017; se ja usa 016, aplique apenas `017-quote-archive.sql`. Nao reaplique migracoes nem rode schema.sql por cima de dados existentes. Leia tambem `ATUALIZAR-ORCAMENTOS-FINANCEIRO.md`.
4. Configure os valores de `.env.example` nas variaveis privadas da hospedagem ou em `.env.local` local. Nunca publique esse arquivo ou use variaveis NEXT_PUBLIC para segredos.
5. Configure APP_URL com o endereco HTTPS correto. Banco remoto exige TLS com certificado validado. Configure SMTP e teste recebimento, verificacao de e-mail, recuperacao de senha e convite; habilite EMAIL_VERIFICATION_REQUIRED. Publique termos e privacidade revisados e configure LEGAL_TERMS_URL e LEGAL_PRIVACY_URL. Em producao SaaS, cadastro publico fica bloqueado sem esses links.
6. Depois das migracoes, habilite SAAS_ENABLED. REGISTRATION_ENABLED libera novas contas apenas quando necessario. Contas antigas migradas mantem o estado legado; o mes gratis nao e renovado ao converter Individual para Empresa ou convidar funcionarios.
7. Node 22.13 ou superior: `npm ci`, `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm start -- --port 3000`. O app precisa de servidor Node, nao hospedagem somente HTML/PHP. A configuracao SaaS do cadastro e lida em tempo de execucao.
8. Execute `npm run check:staging`. Corrija os itens pendentes; depois `npm run check:staging -- --remote` na homologacao. A segunda opcao consulta esquema MySQL, autentica SMTP sem enviar e-mail e consulta preco/portal Stripe de TESTE sem criar cobrancas. Ela nao modifica dados nem comprova os fluxos completos.

## Assinatura e cobranca

Use Stripe em modo TESTE primeiro. Configure preco ativo BRL 4990 centavos, recorrencia mensal, quantidade um, sem imposto adicional ao valor anunciado. O portal deve permitir atualizar pagamento, consultar faturas e cancelar ao fim do periodo; nao permitir trocar de plano. Configure o webhook `/api/billing/webhook` com a chave de assinatura correta e os eventos descritos em `SAAS.md`. BILLING_ENABLED fica false ate configurar e verificar o sandbox; LIVE_PAYMENTS_ENABLED fica false durante homologacao.

O acesso pago depende de periodo finito de fatura integral confirmada, nao da visita a pagina de sucesso. Falha de pagamento nao cria um novo teste gratuito. O checkout so abre apos o acesso expirar, para o dono verificado. Cancelamento preserva somente o periodo ja pago. Defina suporte, cancelamento, politica de reembolso e documentos de contratacao antes de vender; o codigo nao substitui essa definicao.

## Roteiro obrigatorio com servicos reais de teste

- Crie uma conta Individual e uma Empresa. Confira fim do mes calendario de teste, dados separados e ausencia de cobranca automatica durante o teste.
- Crie outra empresa independente; tente acessar IDs da primeira pelo endereco/API. Deve negar sem expor registros.
- Convide recepcao e dois funcionarios com e-mails de teste diferentes. Antes de aceitar/verificar, nenhum acesso deve ser liberado. Depois, confirme menus e tente URLs de financeiro/orcamentos diretamente como funcionario e recepcao.
- Agende dois funcionarios diferentes no mesmo horario. Deve aceitar. Tente sobrepor no mesmo funcionario, fora do expediente e durante ausencia. Deve negar; tentar trocar responsavel para horario ocupado tambem deve negar.
- Aprove um orcamento, agende por ele e crie sua cobranca. Atualize/reenvie: nao deve duplicar. Conclua o atendimento: saldo financeiro nao deve mudar. Registre o recebimento integral em uma aba; repetir em outra nao deve duplicar dinheiro. Teste tambem receber pelo botao do orcamento quando ja existe a cobranca vinculada.
- Registre checklist, foto antes/depois e proxima manutencao como funcionario. Outro funcionario nao pode ver/editar esse relatorio. Gere link como dono; confira conteudo publico. Edite o relatorio, revogue ou expire o link: deve deixar de abrir. Nao coloque dados sensiveis nas fotos ou resumo publico.
- Simule vencimento do teste SOMENTE no banco de homologacao; pague com cartao de teste, entregue/reentregue webhook e confira desbloqueio uma vez. Simule falha, evento fora de ordem e cancelamento. Verifique bloqueio apos o periodo realmente pago, sem apagar dados. Nao altere datas na producao para testar.
- Revogue convite e acesso, arquive funcionario, troque responsavel e tente uma requisicao antiga. Deve negar ou pedir atualizacao. Teste duas abas editando agenda/relatorio para conferir conflito de versao.
- Confira banco restaurado e monitore erros sem registrar tokens, senhas ou conteudo de fotos. Defina retencao e exportacao/exclusao de dados antes de escalar.
- No celular real, confira teclado, rolagem dos formularios, selecao de fotos e todos os principais fluxos. Teste com nomes longos e dados vazios. Colete tempo ate primeiro atendimento, tarefa concluida sem ajuda, motivo de abandono e disposicao para pagar de 5 a 10 negocios do publico inicial.

## IA opcional e limites desta entrega

OPENAI_API_KEY fica no servidor. ASSISTANT_MEDIA_ENABLED=true ativa captura; OPENAI_MODEL configura leitura de foto/interpretacao e OPENAI_TRANSCRIPTION_MODEL configura transcricao de audio. Arquivos de audio: MP3/M4A/WebM/WAV ate 4 MB; nao ha gravacao de microfone no app. Fotos de entrada: JPEG/PNG/WebP ate 12 MB, comprimidas antes do envio. Texto revisado do pedido: ate 400 caracteres; transcricao nao e silenciosamente cortada. Revisao humana continua obrigatoria.

A quota de IA e compartilhada por negocio: 40 unidades/dia, texto custa uma unidade e captura custa tres, inclusive tentativas que ja chegaram ao provedor. Nao equivale a consumo ilimitado. Disponibilidade, modelos, custos e retencao pelo provedor dependem da configuracao/contrato externo. Chamadas Responses usam store:false; isso nao significa retencao zero garantida pelo provedor. Referencias: https://developers.openai.com/api/docs/guides/images-vision e https://developers.openai.com/api/docs/guides/speech-to-text.

Nesta fase, cobranca ligada a orcamento aceita um recebimento integral. Parcelamento ligado ao orcamento nao esta implementado; contas previstas independentes preservam o comportamento anterior de parcelas/pagamentos. Cobranca vinculada cancelada nao pode ser recriada automaticamente pelo mesmo orcamento: confirme o fluxo com suporte, sem duplicar dinheiro. Recepcao pode ver dados de contato dos clientes; funcionario so dos atendimentos atribuidos. Resumo/fotos do relatorio sao destinados ao cliente, nao campo de observacao interna.

Fotos ficam no MySQL, ate quatro JPEG de 250 KB por atendimento. Nao ha armazenamento externo, antivirus de uploads ou assinatura digital nesta entrega. Retorno de manutencao e um lembrete para agendar, nao contrato recorrente com execucao/cobranca automatica; ele considera cliente, assunto do atendimento e data. CSV de importacao, aplicativo nativo, estoque completo, folha e rentabilidade por ordem nao foram adicionados.

## O que os testes locais comprovam

Ao converter Empresa para Individual, remova acessos/convites, arquive funcionarios e reatribua a sua agenda ou cancele os atendimentos pendentes desses funcionarios. O modo Individual nao reabre antigos atendimentos fechados que ainda tenham responsavel de equipe; volte a Empresa para reorganiza-los. Historico e relatorios sao preservados.

Testes de regras e handlers usam banco/provedor simulados; testes de navegador usam dados ficticios identificados como teste. Eles verificam comportamento, permissoes e layout, mas NAO comprovam transacoes/concorrencia em MySQL real, entrega de e-mail, pagamentos, webhook real, qualidade da IA, restauracao de backup ou capacidade em carga. Esses itens continuam pendentes ate executar o roteiro acima. Nao foi feita publicacao nesta entrega. Nao foi criada uma integracao ficticia para simular producao.

Antes de validacao aberta, revise contrato/privacidade com profissional adequado, teste restauracao, habilite monitoramento e complete os fluxos externos. Para comecar pesquisa de usabilidade, use homologacao e apenas dados de teste autorizados.
