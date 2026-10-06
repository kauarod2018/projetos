export const expenseCategories = [
  "Materiais",
  "Transporte",
  "Ferramentas",
  "Contas do negócio",
  "Alimentação",
  "Serviços terceirizados",
  "Marketing",
  "Outros",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];
