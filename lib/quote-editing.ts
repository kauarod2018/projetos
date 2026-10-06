export function canEditQuote(quote: { status: string; approvedAt: string | null }) {
  return !quote.approvedAt && ["Rascunho", "Enviado", "Recusado"].includes(quote.status);
}

export function clientSnapshot(client: { name: string; phone: string; email: string; address: string }) {
  return JSON.stringify({ name: client.name, phone: client.phone, email: client.email, address: client.address });
}

export function readClientSnapshot(value: string | null) {
  if (!value) return {};
  const parsed = JSON.parse(value);
  if (!parsed || !["name", "phone", "email", "address"].every((key) => typeof parsed[key] === "string")) {
    throw new Error("Invalid client snapshot");
  }
  return { name: parsed.name as string, phone: parsed.phone as string, email: parsed.email as string, address: parsed.address as string };
}
