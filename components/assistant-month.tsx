"use client";
import { useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brasiliaDay } from "@/lib/appointments";
import { assistantMonthPeriod } from "@/lib/assistant-period";

export function AssistantMonth({ month, onApply }: { month: string; onApply: (month: string) => void }) {
  const current = brasiliaDay().slice(0, 7);
  const [value, setValue] = useState(month || current);
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!assistantMonthPeriod(new Date(), value)) { setError(true); input.current?.focus(); return; }
    setError(false); onApply(value);
  }
  return <form className="space-y-2 border-b border-gray-200 py-4" onSubmit={submit} noValidate>
    <label htmlFor="assistant-month" className="text-sm font-medium">Mês do resumo</label>
    <div className="flex gap-2"><input ref={input} id="assistant-month" type="month" min="2000-01" max={current} value={value} onChange={event => { setValue(event.target.value); setError(false); }} aria-invalid={error} aria-describedby={error ? "assistant-month-error" : undefined} className="h-11 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-blue-600" /><Button type="submit" size="icon" className="size-11 shrink-0" aria-label="Consultar mês" title="Consultar mês"><Search className="size-4" aria-hidden="true" /></Button></div>
    {error ? <p id="assistant-month-error" role="alert" className="text-sm text-red-700">Escolha um mês entre janeiro de 2000 e o mês atual.</p> : null}
    {month ? <Button type="button" variant="ghost" className="h-11" onClick={() => { setValue(current); setError(false); onApply(""); }}>Voltar ao mês atual</Button> : null}
  </form>;
}
