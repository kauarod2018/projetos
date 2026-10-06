import { z } from "zod";
import { quoteStatuses } from "./models";
import { expenseCategories } from "./transaction-categories";
import { pixText } from "./pix";

const shortText = (max: number) => z.string().trim().max(max);
const email = shortText(254).email().transform((value) => value.toLowerCase());
const optionalEmail = z.union([email, z.literal("")]).default("");
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (value) => {
    const parsed = new Date(value + "T12:00:00Z");
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  },
  "Data inválida.",
);
const cents = z.number().int().min(0).max(100_000_000_000);
export const customerSchema = z.object({
  name: shortText(120).min(1),
  phone: shortText(30).default(""),
  email: optionalEmail,
  address: shortText(300).default(""),
  notes: shortText(1_000).default(""),
});
export const customerCreateSchema = customerSchema.extend({
  requestKey: z.string().uuid().transform(value => value.toLowerCase()).optional(),
}).strict();
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});
export const registerSchema = loginSchema.extend({
  name: shortText(120).min(2),
  phone: shortText(30).default(""),
  password: z.string().min(12, "Use uma senha com pelo menos 12 caracteres.").max(128),
  accountKind: z.enum(["individual", "company"]).default("individual"),
  companyName: shortText(120).default(""),
});
export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.enum(expenseCategories).default("Outros"),
  description: shortText(200).min(1),
  amountCents: cents.refine((value) => value > 0),
  transactionDate: dateSchema,
});
export const transactionCreateSchema = transactionSchema.extend({
  requestKey: z.string().uuid().transform(value => value.toLowerCase()).optional(),
}).strict();
export const quoteSchema = z.object({
  customerId: z.number().int().positive().safe().optional(),
  customer: customerSchema.optional(),
  description: shortText(3_000).default(""),
  validUntil: dateSchema,
  deadline: shortText(120).default("A combinar"),
  paymentMethod: shortText(120).default("Pix"),
  discountCents: cents.default(0),
  items: z.array(z.object({
    kind: z.enum(["service", "material"]).default("service"),
    description: shortText(500).min(1),
    quantity: z.number().positive().max(1_000_000),
    unitPriceCents: cents,
  })).min(1).max(100),
}).superRefine((quote, context) => {
  if (!quote.customerId && !quote.customer) {
    context.addIssue({ code: "custom", message: "Informe o cliente." });
  }
  const total = quote.items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPriceCents), 0);
  if (!Number.isSafeInteger(total) || total > 100_000_000_000 || quote.discountCents > total) {
    context.addIssue({ code: "custom", message: "Revise os valores e o desconto." });
  }
});
export const quoteStatusSchema = z.object({ status: z.enum(quoteStatuses), expectedUpdatedAt: z.string().min(1).max(24).optional() }).strict();
export const publicDecisionSchema = z.object({ status: z.enum(["Aprovado", "Recusado"]) }).strict();
export const businessProfileSchema = z.object({
  pixKey: z.string().trim().max(36).refine(value => value === "" || /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value), "Informe uma chave Pix aleatória válida (UUID v4)."),
  pixName: z.string().trim().max(80),
  pixCity: z.string().trim().max(80),
}).strict().superRefine((profile, context) => {
  if (!profile.pixKey) return;
  const name = pixText(profile.pixName);
  const city = pixText(profile.pixCity);
  if (!name || name.length > 25) context.addIssue({ code: "custom", path: ["pixName"], message: "O nome do recebedor é obrigatório e deve caber em 25 caracteres do Pix." });
  if (!city || city.length > 15) context.addIssue({ code: "custom", path: ["pixCity"], message: "A cidade é obrigatória e deve caber em 15 caracteres do Pix." });
});
