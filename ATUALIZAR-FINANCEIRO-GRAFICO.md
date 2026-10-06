# Financeiro: grafico por categoria

Pacote cumulativo: `vemo-financeiro-grafico.tar.gz`.

## Publicar

Nao ha SQL novo nesta atualizacao. Ela usa as categorias incluidas na migracao
011. Depois que 011 estiver aplicada, envie o pacote para a mesma aplicacao
Next.js da Hostinger, mantendo variaveis de ambiente, diretorio raiz,
`npm run build` e `npm start`.

## Conferir

Na pagina **Financeiro**, escolha o mes de referencia. O grafico mostra os
gastos daquele mes agrupados por categoria, junto com os valores em texto.
Meses sem despesas mostram a mensagem de lista vazia. Compare o total com
"Saiu no mes" e os lancamentos listados mais abaixo; despesas antigas sem
categoria ficam em "Outros".

## Verificacao local

Skills aplicadas: composicao visual, acessibilidade, React/Next.js e navegacao
de formularios. Compilacao de producao executada; consulte o resultado final.
Nao houve acesso ao banco real nem publicacao automatica na Hostinger.
