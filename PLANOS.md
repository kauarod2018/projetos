# Planos de assinatura (decidido em 07/10/2026, implementar só depois da validação)

Nada disto está implementado. Hoje existe um único plano de R$ 49,90/mês.
Implementar somente depois que o site estiver validado em produção.

## Planos
| | Individual | Empresa |
|---|---|---|
| Para quem | Trabalha sozinho | Tem equipe |
| Preço | a definir (sugestão R$ 29,90 a R$ 39,90) | a definir (sugestão R$ 69,90 a R$ 89,90) |
| Orçamentos | até 50 por mês | ilimitados |
| Logo no orçamento | não | sim |
| Funcionários e permissões | não | sim, ilimitados |
| Demais recursos | iguais | iguais |

## Assinantes fundadores
- Quem assinar o plano atual (R$ 49,90) antes do lançamento dos dois planos vira **Empresa** automaticamente.
- Esses assinantes **mantêm R$ 49,90** enquanto a assinatura continuar ativa ("preço de fundador").
- Podem trocar para o Individual se quiserem; nesse caso passam a ter os limites do Individual.

## Pontos para a implementação
- Marcar no banco quem é fundador (data de assinatura anterior ao lançamento) e o preço travado.
- No Stripe: um preço para Individual, um para Empresa e manter o preço atual de R$ 49,90 só para fundadores.
- Contagem de orçamentos por mês calendário, no fuso de Brasília; avisar ao chegar perto do limite (ex.: 40 de 50).
- Orçamentos já criados nunca são bloqueados ou apagados por causa do limite.
- Ao trocar de Empresa para Individual, a logo deixa de aparecer nos orçamentos novos, mas não é apagada.
- Atualizar a página de preços, os termos de uso e o texto do teste grátis.

## Futuro: WhatsApp automático no plano Empresa (ideia aprovada para avaliar depois)
- Usar somente a **API oficial do WhatsApp Business (Meta, Cloud API)**. Nada de bibliotecas não oficiais, que podem fazer o número ser banido.
- Cada empresa conecta o próprio número pelo "cadastro incorporado" da Meta, sem copiar tokens à mão. Para oferecer isso, o Vemo precisa se tornar parceiro técnico da Meta, ou usar um provedor oficial (BSP) como intermediário.
- Mensagens enviadas pela empresa (lembrete, confirmação) precisam de **modelos aprovados pela Meta** e de autorização do cliente para receber mensagens.
- A Meta cobra por mensagem enviada com modelo. Opções: cota mensal incluída no Empresa, pacote extra ou repasse do custo. Conferir os preços atuais da Meta antes de definir.
- O que implementar no Vemo: tela de conexão, modelos (confirmar, lembrete, a caminho, agradecimento), envio agendado (ex.: lembrete na véspera às 18h), registro do que foi enviado e leitura das respostas (cliente responde "SIM" e o atendimento muda para Confirmado).
- Requer tarefa agendada no servidor e um endereço para receber as respostas da Meta (webhook). Conferir se a hospedagem da Hostinger mantém isso funcionando.
- Manter o envio manual atual para o plano Individual e como alternativa quando a API não estiver conectada.
