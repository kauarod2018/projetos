type Visit = { id: number; customerId: number | null; quoteId: number | null; employeeId: number | null; title: string; customerName: string; startsAt: string; status: string };
type Quote = { id: number; customerId: number; customerName: string; status: string };
type Return = { appointmentId: number; customerId: number | null; customerName: string; title: string; nextVisitOn: string; startsAt: string };
export type OperationTask = { key: string; label: string; detail: string; href: string; action: string; priority: number };
export function operationsQueue(visits: Visit[], quotes: Quote[], charges: { quoteId: number | null; status: string }[], returns: Return[], today: string, company: boolean) {
  const tasks: OperationTask[] = [];
  for (const visit of visits) {
    if (company && visit.employeeId === null && !["Concluído", "Cancelado"].includes(visit.status)) tasks.push({ key: `assign-${visit.id}`, label: `Definir responsável: ${visit.title}`, detail: `${visit.customerName} · ${visit.startsAt.slice(0, 10)} às ${visit.startsAt.slice(11)}`, href: `/agenda?data=${visit.startsAt.slice(0, 10)}`, action: "Organizar agenda", priority: visit.startsAt.slice(0, 10) <= today ? 0 : 2 });
  }
  for (const quote of quotes) {
    const linked = visits.filter(visit => visit.quoteId === quote.id && visit.status !== "Cancelado");
    if (quote.status === "Aprovado" && !linked.length) tasks.push({ key: `schedule-${quote.id}`, label: `Agendar serviço: ${quote.customerName}`, detail: `Orçamento #${quote.id} aprovado`, href: `/agenda?orcamento=${quote.id}&cliente=${quote.customerId}`, action: "Agendar serviço", priority: 1 });
    if (quote.status !== "Pago" && linked.length && linked.every(visit => visit.status === "Concluído") && !charges.some(charge => charge.quoteId === quote.id && charge.status !== "canceled")) tasks.push({ key: `charge-${quote.id}`, label: `Conferir cobrança: ${quote.customerName}`, detail: `Atendimento concluído · orçamento #${quote.id}`, href: `/orcamentos/${quote.id}`, action: "Abrir orçamento", priority: 1 });
  }
  for (const reminder of returns) {
    if (!reminder.customerId || visits.some(visit => visit.customerId === reminder.customerId && visit.title === reminder.title && visit.status !== "Cancelado" && visit.startsAt > reminder.startsAt && visit.startsAt.slice(0, 10) >= reminder.nextVisitOn)) continue;
    tasks.push({ key: `return-${reminder.appointmentId}`, label: `Retorno de manutenção: ${reminder.customerName}`, detail: `${reminder.title} · previsto para ${reminder.nextVisitOn}`, href: `/agenda?cliente=${reminder.customerId}&data=${reminder.nextVisitOn < today ? today : reminder.nextVisitOn}`, action: "Agendar retorno", priority: reminder.nextVisitOn <= today ? 0 : 3 });
  }
  return tasks.sort((a,b) => a.priority - b.priority || a.key.localeCompare(b.key));
}
