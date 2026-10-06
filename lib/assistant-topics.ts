export const assistantTopics = [
  { value: "today", label: "Agenda de hoje" },
  { value: "tomorrow", label: "Agenda de amanhã" },
  { value: "receivable", label: "Valores a receber" },
  { value: "receivableClients", label: "Clientes com valores a receber" },
  { value: "obligations", label: "Vencimentos próximos" },
  { value: "income", label: "Entradas do mês" },
  { value: "expenses", label: "Saídas do mês" },
  { value: "cashflow", label: "Resumo financeiro do mês" },
  { value: "followups", label: "Orçamentos sem resposta" },
] as const;
export type AssistantTopic = typeof assistantTopics[number]["value"];
export type AssistantAnswer = {
  topic: AssistantTopic; title: string; period: string; source: string;
  checkedAt: string; count: number; totalCents?: number;
  month?: string;
  cashflow?: { incomeCents: number; expenseCents: number; differenceCents: number };
  expenseCategories?: { category: string; amountCents: number; count: number }[];
  obligations?: ObligationBuckets;
  records: { id: number; title: string; detail: string; value: string; href: string }[];
  href: string; empty: string;
};

export type ObligationBuckets = {
  overdue: { receivable: { count: number; remainingCents: number }; payable: { count: number; remainingCents: number } };
  upcoming: { receivable: { count: number; remainingCents: number }; payable: { count: number; remainingCents: number } };
};
