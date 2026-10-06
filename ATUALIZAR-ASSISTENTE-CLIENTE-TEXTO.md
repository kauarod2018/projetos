# Atualizacao: cadastrar cliente por texto na Assistente

Exemplos aceitos:

- `Cadastre cliente Ana Souza`
- `Cadastra cliente João da Silva, celular (11) 99999-9999`
- `Adicione a cliente Maria, WhatsApp: +55 (21) 98765-4321`

O nome e o telefone, quando informado, aparecem no formulario de cadastro.
Complete os demais campos que desejar, revise e confirme. A frase so prepara
o formulario; o cliente nao e cadastrado antes da confirmacao.

## Publicacao na Hostinger

Envie `vemo-assistente-cliente-texto.tar.gz` para a aplicacao Node.js atual.
Nao ha SQL novo, dependencia ou variavel de ambiente nesta atualizacao.
A migracao 009 do cadastro guiado existente ja deve estar aplicada.

## Conferencia recomendada

1. Digite uma das frases acima na Assistente e confira nome e telefone.
2. Cancele antes da confirmacao e verifique que nenhum cadastro apareceu.
3. Repita, confirme e abra o historico do novo cliente.
4. Teste um telefone incompleto e dois nomes unidos por "e"; devem ser recusados.
5. Teste a partir de duas contas e confira que os clientes continuam separados.

O contato e validado novamente no servidor. A chave de solicitacao protege
repeticoes da confirmacao na mesma tela. Ao iniciar outro cadastro, confira a
lista de clientes: nomes iguais podem representar pessoas diferentes e nao
sao mesclados automaticamente.
