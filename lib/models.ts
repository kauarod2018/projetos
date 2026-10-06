export const quoteStatuses = [
  "Rascunho",
  "Enviado",
  "Aprovado",
  "Em andamento",
  "Finalizado",
  "Pago",
  "Recusado",
] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
};

export type Service = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  durationMinutes: number;
  archived: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type QuoteItem = {
  id: number;
  quoteId: number;
  kind: "service" | "material";
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type PixPaymentInfo = {
  key: string;
  name: string;
  city: string;
  amountCents: number;
  payload: string;
};

export type Quote = {
  id: number;
  customerId: number;
  client: Customer;
  description: string;
  status: QuoteStatus;
  validUntil: string;
  deadline: string;
  paymentMethod: string;
  discountCents: number;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  approvedAt: string | null;
  archivedAt?: string | null;
  publicToken: string;
  pixPayment?: PixPaymentInfo | null;
  ownerName: string;
  items: QuoteItem[];
  subtotalCents: number;
  totalCents: number;
};

export type FinanceTransaction = {
  id: number;
  quoteId?: number | null;
  receiptVersion?: number;
  type: "income" | "expense";
  category?: import("./transaction-categories").ExpenseCategory;
  description: string;
  amountCents: number;
  transactionDate: string;
  createdAt: string;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatMoney(cents: number) {
  return moneyFormatter.format(cents / 100);
}

export function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}
