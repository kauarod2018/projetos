import type { FinanceTransaction } from "@/lib/models";
import { formatDate } from "@/lib/models";

function csvCell(value: string) {
  const safeValue = /^[\u0000-\u0020]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export function buildFinanceCsv(transactions: FinanceTransaction[]) {
  const rows = [
    ["Data", "Tipo", "Descrição", "Categoria", "Valor (R$)", "Orçamento"],
    ...transactions.map((transaction) => [
      formatDate(transaction.transactionDate),
      transaction.type === "income" ? "Entrada" : "Saída",
      transaction.description,
      transaction.type === "expense" ? transaction.category ?? "Outros" : "",
      (Math.abs(transaction.amountCents) / 100).toFixed(2).replace(".", ","),
      transaction.quoteId ? `#${transaction.quoteId}` : "",
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}
