import type { Customer } from "./models";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");

export function customerMatches(customer: Pick<Customer, "name" | "phone" | "email">, query: string) {
  const text = normalize(query);
  if (!text) return true;
  if ([customer.name, customer.email, customer.phone].some(value => normalize(value).includes(text))) return true;
  const digits = text.replace(/\D/g, "");
  return Boolean(digits && /^[\d\s()+.\-]+$/.test(text) && customer.phone.replace(/\D/g, "").includes(digits));
}
