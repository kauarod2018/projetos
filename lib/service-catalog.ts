import { z } from "zod";
import type { Service } from "./models";

export const serviceFieldsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do serviço.").max(120, "Use até 120 caracteres."),
  description: z.string().trim().max(300, "Use até 300 caracteres.").default(""),
  priceCents: z.number().int().min(0, "Informe um preço válido.").max(1_000_000_000, "O preço máximo é R$ 10.000.000,00."),
  durationMinutes: z.number().int("Informe minutos inteiros.").min(1, "Informe pelo menos 1 minuto.").max(10_080, "A duração máxima é de 10.080 minutos (7 dias)."),
}).strict();

export const serviceCreateSchema = serviceFieldsSchema.extend({ requestKey: z.string().uuid() }).strict();
export const serviceUpdateSchema = serviceFieldsSchema.extend({ version: z.number().int().positive().max(4_294_967_294) }).strict();
export const serviceArchiveSchema = z.object({ archived: z.boolean(), version: z.number().int().positive().max(4_294_967_294) }).strict();

export function parseServicePrice(input: string): number | null {
  const value = input.trim().replace(/^R\$\s*/, "");
  if (!value || value.length > 24) return null;
  let whole: string;
  let fraction: string;
  if (/^\d+(\.\d{1,2})?$/.test(value)) [whole, fraction = ""] = value.split(".");
  else if (/^(\d+|\d{1,3}(\.\d{3})+)(,\d{1,2})?$/.test(value)) {
    const parts = value.split(",");
    whole = parts[0].replaceAll(".", "");
    fraction = parts[1] ?? "";
  } else return null;
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function servicePriceInput(cents: number) {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}min` : ""}` : `${rest}min`;
}

export function serviceQuoteItem(service: Service) {
  return {
    kind: "service" as const,
    description: service.description ? `${service.name} - ${service.description}` : service.name,
    quantity: 1,
    unitPriceCents: service.priceCents,
  };
}
