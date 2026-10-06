import type { AssistantTopic } from "./assistant-topics";

// Full-phrase matching avoids silently ignoring amounts, people or extra commands.
const questions: Record<AssistantTopic, readonly string[]> = {
  today: ["agenda de hoje", "minha agenda de hoje", "qual a agenda de hoje", "qual e a minha agenda de hoje", "o que tenho hoje", "quais meus compromissos de hoje", "meus atendimentos de hoje"],
  tomorrow: ["agenda de amanha", "minha agenda de amanha", "qual a agenda de amanha", "qual e a minha agenda de amanha", "o que tenho amanha", "quais meus compromissos de amanha", "meus atendimentos de amanha"],
  receivable: ["valores a receber", "quanto tenho a receber", "quanto falta receber", "total a receber", "o que tenho a receber"],
  receivableClients: ["clientes com valores a receber", "quais clientes tem valores a receber", "quem esta me devendo"],
  obligations: ["vencimentos proximos", "o que vence esta semana", "o que vence nos proximos 7 dias", "contas vencidas", "vencimentos pendentes", "quais contas estao vencidas"],
  income: ["entradas do mes", "quanto recebi este mes", "quanto recebi nesse mes", "quanto entrou este mes", "total recebido no mes", "entradas deste mes"],
  expenses: ["saidas do mes", "quanto gastei este mes", "quanto gastei nesse mes", "quanto saiu este mes", "total de despesas do mes", "despesas deste mes"],
  cashflow: ["resumo financeiro do mes", "resumo do mes", "quanto sobrou este mes", "o que sobrou este mes", "quanto entrou e saiu este mes"],
  followups: ["orcamentos sem resposta", "quais orcamentos estao sem resposta", "quem nao respondeu ao orcamento", "orcamentos aguardando resposta"],
};

export function recognizeAssistantQuestion(input: string): AssistantTopic | null {
  if (input.length > 240) return null;
  const normalized = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[?!.]+$/, "").trim().replace(/\s+/g, " ");
  for (const [topic, phrases] of Object.entries(questions)) {
    if (phrases.includes(normalized)) return topic as AssistantTopic;
  }
  return null;
}

export type AssistantInput =
  | { type: "query"; topic: AssistantTopic }
  | { type: "receipt"; clientName: string; amountCents: number }
  | { type: "appointment"; clientName: string; startsAt: string }
  | { type: "quote"; clientName: string; amountCents: number }
  | { type: "expense"; description: string; amountCents: number }
  | { type: "customer"; name: string; phone: string };

export function parseAssistantInput(value: unknown): AssistantInput | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (item.type === "query" && typeof item.topic === "string" && Object.hasOwn(questions, item.topic)) return item as AssistantInput;
  if ((item.type === "receipt" || item.type === "quote") && typeof item.clientName === "string" && item.clientName.length >= 2 && item.clientName.length <= 120 && Number.isSafeInteger(item.amountCents) && Number(item.amountCents) > 0) return item as AssistantInput;
  if (item.type === "expense" && typeof item.description === "string" && item.description.length >= 2 && item.description.length <= 200 && Number.isSafeInteger(item.amountCents) && Number(item.amountCents) > 0) return item as AssistantInput;
  if (item.type === "appointment" && typeof item.clientName === "string" && item.clientName.length >= 2 && item.clientName.length <= 120 && typeof item.startsAt === "string" && /^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(item.startsAt)) return item as AssistantInput;
  if (item.type === "customer" && typeof item.name === "string" && item.name.length >= 2 && item.name.length <= 120 && typeof item.phone === "string" && item.phone.length <= 30) return item as AssistantInput;
  return null;
}

function brasiliaDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return { day: `${values.year}-${values.month}-${values.day}`, minute: `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}` };
}

function recognizeAppointment(input: string, now: Date): Extract<AssistantInput, { type: "appointment" }> | null {
  const normalized = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(?:nao|nunca|ontem|anteontem|amanha|hoje|dia\s+\d{1,2})\b/.test(normalized)) return null;
  if (!/\b(?:marca|marcar|marque|agenda|agendar|agende)\b/.test(normalized)) return null;

  const weekdays = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const dayMatches = [...normalized.matchAll(/\b(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira)?\b/g)];
  if (dayMatches.length !== 1) return null;
  const hourMatch = normalized.match(/\b([01]?\d|2[0-3])\s*(?::|h|horas?)([0-5]\d)?\s*(?:h|horas)?\b/);
  if (!hourMatch) return null;

  const nameMatch = input.match(/\b(?:marca|marcar|marque|agenda|agendar|agende)\s+(?:um\s+)?(?:atendimento\s+)?(?:com\s+)?(?:a|o)?\s*([\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}'’.-]*(?:\s+[\p{L}\p{M}\p{N}'’.-]+){0,4}?)(?=\s+(?:para|na|nesta|nessa|proxima|proximo|domingo|segunda|terca|quarta|quinta|sexta|sabado|as)\b)/iu);
  if (!nameMatch) return null;
  const clientName = nameMatch[1].trim();
  if (clientName.length < 2 || clientName.length > 120 || /\s+e\s+(?:o|a|um|uma)\s/i.test(clientName)) return null;

  const today = brasiliaDate(now);
  const currentWeekday = new Date(`${today.day}T12:00:00Z`).getUTCDay();
  const requestedWeekday = weekdays.indexOf(dayMatches[0][1]);
  const offset = (requestedWeekday - currentWeekday + 7) % 7 || 7;
  const date = new Date(Date.parse(`${today.day}T12:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);
  const hour = hourMatch[1].padStart(2, "0");
  const minute = (hourMatch[2] ?? "00").padStart(2, "0");
  const startsAt = `${date}T${hour}:${minute}`;
  if (startsAt <= today.minute) return null;
  return { type: "appointment", clientName, startsAt };
}

function parseBrazilianAmount(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 100_000_000_000 ? cents : null;
}

function recognizeCustomer(input: string): Extract<AssistantInput, { type: "customer" }> | null {
  const text = input.trim().replace(/[.!?]+$/, "").trim();
  const match = text.match(/^(?:cadastra|cadastre|cadastrar|adiciona|adicione|adicionar|salva|salvar)\s+(?:(?:o|a|um|uma)\s+)?cliente\s+(.+?)(?:\s*,\s*(?:celular|telefone|whatsapp)\s*:?[ \t]*(.+))?$/iu);
  if (!match) return null;

  const name = match[1].trim().replace(/\s+/g, " ");
  const phone = match[2]?.trim() ?? "";
  if (name.length < 2 || name.length > 120 || !/\p{L}/u.test(name)
    || !/^[\p{L}\p{M}\p{N}'’.-]+(?:\s+[\p{L}\p{M}\p{N}'’.-]+)*$/u.test(name)
    || /\s+e\s+/i.test(name)) return null;
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (phone.length > 30 || !/^[\d\s()+.-]+$/.test(phone)
      || !([10, 11].includes(digits.length) || ([12, 13].includes(digits.length) && digits.startsWith("55")))) return null;
  }
  return { type: "customer", name, phone };
}

function recognizeQuote(input: string): Extract<AssistantInput, { type: "quote" }> | null {
  const normalized = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(?:nao|nunca|cancele|cancela|pare)\b/.test(normalized)) return null;
  if (!/\b(?:cria|crie|criar|prepara|prepare|preparar|faz|fazer)\b/.test(normalized) || !/\borcamento\b/.test(normalized)) return null;

  const amountPattern = /\bR\$\s*([0-9]+(?:\.[0-9]{3})*(?:,[0-9]{1,2})?)(?![0-9.,])/i;
  const amountMatch = input.match(amountPattern)
    ?? input.match(/(?<![0-9.,])\b([0-9]+(?:\.[0-9]{3})*(?:,[0-9]{1,2})?)(?![0-9.,])\s+reais?\b/i);
  const markers = input.match(/R\$|\breais?\b/gi) ?? [];
  const amountCents = amountMatch ? parseBrazilianAmount(amountMatch[1]) : null;
  if (!amountMatch || markers.length !== 1 || amountCents === null) return null;

  const customerMatch = input.match(/\bpara\s+(?:(?:o|a)\s+)?([\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}'’.-]*(?:\s+[\p{L}\p{M}\p{N}'’.-]+){0,7}?)\s*[,;.!?]*$/iu);
  if (!customerMatch) return null;
  const clientName = customerMatch[1].trim();
  if (clientName.length < 2 || clientName.length > 120 || /\s+e\s+(?:o|a|um|uma)?\s*/i.test(clientName)) return null;
  return { type: "quote", clientName, amountCents };
}

function recognizeExpense(input: string): Extract<AssistantInput, { type: "expense" }> | null {
  const normalized = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!/\b(?:paguei|gastei|despesa)\b/.test(normalized)) return null;
  if (/\b(?:nao|nunca|ontem|anteontem|amanha|segunda|terca|quarta|quinta|sexta|sabado|domingo|semana|dia\s+\d{1,2})\b/.test(normalized)) return null;

  const amountMatch = input.match(/\bR\$\s*([0-9]+(?:\.[0-9]{3})*(?:,[0-9]{1,2})?)(?![0-9.,])/i)
    ?? input.match(/(?<![0-9.,])\b([0-9]+(?:\.[0-9]{3})*(?:,[0-9]{1,2})?)(?![0-9.,])\s+reais?\b/i);
  const amountIndex = amountMatch?.index;
  const markers = input.match(/R\$|\breais?\b/gi) ?? [];
  const amountCents = amountMatch ? parseBrazilianAmount(amountMatch[1]) : null;
  if (!amountMatch || amountIndex === undefined || markers.length !== 1 || amountCents === null) return null;

  const prefix = input.slice(0, amountIndex).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const command = /^(?:registra|registre|registrar|anota|anote|anotar|lanca|lance|lancar)$/;
  const direct = /^(?:paguei|gastei)$/;
  const namedExpense = /^(?:registra|registre|registrar|anota|anote|anotar|lanca|lance|lancar)\s+(?:(?:uma|a)\s+)?despesa(?:\s+de)?$/;
  if (!direct.test(prefix) && !namedExpense.test(prefix) && !command.test(prefix)) return null;

  const tail = input.slice(amountIndex + amountMatch[0].length).trim().replace(/[.!?]+$/, "").trim();
  const detail = tail.match(/^(?:(que\s+(?:paguei|gastei))\s+)?(?:em|com|por|de|para)\s+(.+)$/iu);
  if (!detail || (command.test(prefix) && !detail[1])) return null;
  const description = detail[2].replace(/\s+hoje$/iu, "").trim();
  if (description.length < 2 || description.length > 200 || !/\p{L}/u.test(description)
    || !/^[\p{L}\p{M}\p{N}\s,'’./()-]+$/u.test(description)
    || /\b(?:recebi|receber|marquei|agendei|orcamento|paguei|gastei)\b/.test(description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) return null;
  return { type: "expense", description, amountCents };
}

export function recognizeAssistantInput(input: string, now = new Date()): AssistantInput | null {
  const topic = recognizeAssistantQuestion(input);
  if (topic) return { type: "query", topic };
  if (input.length > 240) return null;
  const customer = recognizeCustomer(input);
  if (customer) return customer;
  const expense = recognizeExpense(input);
  if (expense) return expense;
  const quote = recognizeQuote(input);
  if (quote) return quote;
  const appointment = recognizeAppointment(input, now);
  if (appointment) return appointment;

  const normalized = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(?:paguei|gastei|despesa)\b/.test(normalized)) return null;
  if (/\b(?:nao|nunca|ontem|anteontem|amanha|segunda|terca|quarta|quinta|sexta|sabado|domingo|dia\s+\d{1,2})\b/.test(normalized)) return null;
  if (!/\b(registr(?:a|e|ar)|lanc(?:a|e|ar)|anot(?:a|e|ar)|receb(?:i|emos|eu|ido|ida|idos|idas|imento)?)\b/.test(normalized)) return null;

  const amountMatch = input.match(/\bR\$\s*([0-9]+(?:\.[0-9]{3})*(?:,[0-9]{1,2})?)(?![0-9.,])/i)
    ?? input.match(/(?<![0-9.,])\b([0-9]+(?:\.[0-9]{3})*(?:,[0-9]{1,2})?)(?![0-9.,])\s+reais?\b/i);
  const amountCents = amountMatch ? parseBrazilianAmount(amountMatch[1]) : null;
  if (!amountMatch || amountCents === null) return null;

  const customerMatch = input.match(/\b(?:do|da|de)\s+([\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}'’.-]*(?:\s+[\p{L}\p{M}\p{N}'’.-]+){0,7})/iu);
  if (!customerMatch) return null;
  const clientName = customerMatch[1]
    .replace(/(?:\s+(?:hoje|agora|no pix|por pix|via pix|em dinheiro|no dinheiro))+$/i, "")
    .replace(/[.,;:!?]+$/, "").trim();
  if (clientName.length < 2 || clientName.length > 120 || /\s+e\s+(?:do|da|de)\s/i.test(clientName)) return null;

  return { type: "receipt", clientName, amountCents };
}
