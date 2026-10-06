# Correcao do alerta Next.js

Pacote cumulativo: `vemo-seguranca-next-16.3.6.tar.gz`.
Continua a mesma base de Servicos, Agenda, Recebimentos e Historico do cliente.

## O que mudou

Next.js atualizado de 16.3.4 para 16.3.6, com package-lock.json e componentes
internos correspondentes. Nao houve alteracao das regras do negocio ou banco.

A versao 16.3.6 corrige CVE-2026-94545, conforme o aviso oficial:
https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j

A falha envolve geracao de imagens por ImageResponse de next/og no Node.js
com dados nao confiaveis em SVG. Nao foi encontrado uso desse recurso no
codigo do Vemo. Isso nao substitui a atualizacao da dependencia. O alerta
de versao vulneravel, sozinho, nao comprova invasao ou vazamento.

## Publicar

1. Guarde backup e envie este pacote na mesma aplicacao Node.js da Hostinger.
2. Preserve variaveis de ambiente, Next.js, raiz `/`, `npm run build` e
   `npm start`. A Hostinger precisa instalar as dependencias e recompilar.
3. Confirme que o registro de compilacao mostra Next.js 16.3.6 e que a nova
   implantacao ficou ativa. Nao basta enviar o arquivo sem concluir a implantacao.
4. Confira login, clientes, agenda, orcamentos e financeiro.
5. Confira a proxima verificacao de seguranca no painel. Caso continue mostrando
   16.3.4, confira a data da verificacao e qual implantacao esta ativa. Nao
   ignore um alerta atual sem verificar a versao efetivamente publicada.

Esta correcao nao precisa de SQL. Se ainda nao instalou a etapa Recebimentos,
o pacote cumulativo depende da migracao 007; siga ATUALIZAR-RECEBIMENTOS.md.
Se a 007 ja foi aplicada, nao importe novamente. Nao importe schema.sql.

Nao reimplante os pacotes antigos com Next.js 16.3.4 para desfazer uma mudanca.
Uma reversao de funcionalidades tambem precisa manter a versao corrigida.

## Limites da verificacao

Auditoria npm apos a instalacao informou zero vulnerabilidades conhecidas
naquele momento; isso nao e garantia de ausencia de falhas. A verificacao
do site publicado e a nova varredura da Hostinger ficam pendentes ate o envio.
Nenhuma credencial, dado real ou configuracao da hospedagem foi alterada.
