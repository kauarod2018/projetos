// Mensagens prontas de WhatsApp para a Agenda. O envio é sempre feito pelo próprio
// usuário no WhatsApp (link wa.me); o Vemo não dispara mensagens sozinho.
import type { Appointment } from "./appointments";

export type WhatsappTemplate = "confirm" | "reminder" | "onTheWay" | "thanks";

export const whatsappTemplates: { value: WhatsappTemplate; label: string; hint: string }[] = [
  { value: "confirm", label: "Confirmar horário", hint: "Pede para o cliente confirmar" },
  { value: "reminder", label: "Lembrete", hint: "Lembra do atendimento marcado" },
  { value: "onTheWay", label: "Estou a caminho", hint: "Avisa que você está indo" },
  { value: "thanks", label: "Agradecer", hint: "Depois do serviço concluído" },
];

export function whatsappNumber(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  return null;
}

function dayText(startsAt: string, today: string) {
  const day = startsAt.slice(0, 10);
  if (day === today) return "hoje";
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  if (day === tomorrow) return "amanhã";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

export function whatsappMessage(template: WhatsappTemplate, appointment: Pick<Appointment, "customerName" | "title" | "startsAt">, today: string, businessName?: string) {
  const name = appointment.customerName.trim().split(/\s+/)[0] || appointment.customerName;
  const when = `${dayText(appointment.startsAt, today)} às ${appointment.startsAt.slice(11, 16)}`;
  const from = businessName ? ` Aqui é da ${businessName}.` : "";
  switch (template) {
    case "confirm": return `Olá, ${name}!${from} Podemos confirmar o atendimento de ${appointment.title} ${when}? Responda com SIM para confirmar ou me avise se precisar remarcar.`;
    case "reminder": return `Olá, ${name}!${from} Passando para lembrar do atendimento de ${appointment.title} ${when}. Qualquer imprevisto, é só me avisar por aqui. Até lá!`;
    case "onTheWay": return `Olá, ${name}! Estou a caminho para o atendimento de ${appointment.title}. Chego em breve!`;
    case "thanks": return `Olá, ${name}! Obrigado pela confiança no serviço de ${appointment.title}.${from} Se precisar de algo, estou à disposição. Uma indicação para amigos ajuda muito!`;
  }
}

export function whatsappMessageUrl(phone: string | null | undefined, message: string) {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
