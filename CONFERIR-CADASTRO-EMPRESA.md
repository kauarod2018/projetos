# Conferir o cadastro Empresa na Hostinger

O pacote tar.gz atualiza o codigo do site. Ele nao executa as atualizacoes SQL do banco nem configura as variaveis da hospedagem.

## Primeiro passo: consultar, sem alterar

1. Abra o phpMyAdmin e selecione o banco que o Vemo utiliza. Se houver varios bancos e voce nao souber qual e o correto, pare e confirme antes.
2. Na aba SQL, execute o conteudo de `database/VERIFICAR-SaaS-Somente-Leitura.sql`. Outra opcao e importar somente esse arquivo de diagnostico pela aba Importar. Ele contem apenas consultas SELECT a metadados.
3. Envie um print da tabela de resultados com as colunas etapa, tabela, item e resultado. Nao envie senhas, dados de clientes, arquivos de backup ou telas com credenciais. Se preferir, informe quais linhas mostram NAO_ENCONTRADO.

ENCONTRADO significa apenas que a tabela ou coluna existe. Nao comprova os tipos, indices, relacionamentos ou o preenchimento das empresas para contas antigas. Esta consulta e uma triagem, nao uma autorizacao para ativar o SaaS. Nenhuma consulta foi executada no seu banco por esta entrega.

## Nao executar ainda

- Nao importe `schema.sql` sobre o banco atual.
- Nao importe todas as migracoes em bloco nem reaplique arquivos SQL ja executados.
- Nao ative SAAS_ENABLED antes de conferir o esquema e as contas antigas migradas.
- Mantenha cobranca real desativada. Ativar o cadastro Empresa nao exige ativar pagamentos reais.

Depois da triagem, o procedimento deve incluir backup com restauracao testada em um banco separado, conferencia das atualizacoes pendentes e teste nesse ambiente separado. Se uma migracao estiver parcialmente aplicada, a correcao precisa ser especifica; nao basta executar o mesmo arquivo outra vez.

## Etapas posteriores

Somente apos validar banco e isolamento das contas, configure SAAS_ENABLED=true nas variaveis privadas da aplicacao e reinicie/republique a aplicacao. Isso disponibiliza a escolha Individual/Empresa no cadastro. Para permitir novas contas, REGISTRATION_ENABLED tambem precisa estar true. Sao configuracoes distintas.

Cadastros publicos no modo SaaS tambem exigem links HTTPS validos de termos e privacidade. Antes de abrir a validacao publica, configure e teste envio e verificacao de e-mail, convites e recuperacao de senha. BILLING_ENABLED e LIVE_PAYMENTS_ENABLED devem continuar false ate validar os pagamentos separadamente.

## Referencias oficiais

- Acesso ao phpMyAdmin: https://support.hostinger.com/en/articles/1583545-how-to-access-phpmyadmin-at-hostinger
- Importacao SQL: https://www.hostinger.com/support/1884149-how-to-import-a-database-with-phpmyadmin-in-hostinger/
- Exportacao para backup: https://www.hostinger.com/support/4529011-how-to-export-a-database-with-phpmyadmin-in-hostinger/
