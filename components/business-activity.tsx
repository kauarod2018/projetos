"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/models";

type ActivityItem = { id: number; action: string; entityType: string; entityId: number | null; title: string; reversible: boolean; undoneAt: string | null; createdAt: string };
const timeLabel = (value: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export function BusinessActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<number | null>(null);
  const [visible, setVisible] = useState(8);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/activity", { cache: "no-store" });
      const data = await response.json() as { activities?: ActivityItem[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar o histórico.");
      setItems(data.activities ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar o histórico."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function undo(item: ActivityItem) {
    if (working !== null) return;
    const explanation = item.entityType === "appointment" ? "O compromisso será cancelado, sem apagar o registro." : "O lançamento será estornado e permanecerá no histórico.";
    if (!window.confirm(`Desfazer esta ação? ${explanation}`)) return;
    setWorking(item.id); setError("");
    try {
      const response = await fetch(`/api/activity/${item.id}/undo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível desfazer esta ação.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível desfazer esta ação."); }
    finally { setWorking(null); }
  }

  return <section className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="business-activity-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="business-activity-title" className="flex items-center gap-3 text-[17px] font-semibold"><span className="grid size-10 place-items-center rounded-xl bg-[var(--vemo-brand-soft)] text-[var(--vemo-brand)]"><Activity className="size-5" aria-hidden="true" /></span>Histórico de ações</h2><p className="mt-2 text-sm text-[var(--vemo-muted)]">Tudo o que foi feito no sistema. Desfazer mantém o registro.</p></div><Button type="button" variant="outline" className="min-h-11 rounded-full" onClick={() => void load()} disabled={loading}><RotateCcw className="size-4" aria-hidden="true" />Atualizar</Button></div>
    {error ? <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    {loading ? <p role="status" className="py-6 text-sm text-[var(--vemo-muted)]">Carregando histórico…</p> : !items.length ? <p className="py-8 text-center text-sm text-[var(--vemo-muted)]">As ações registradas aparecerão aqui.</p> : <ol className="mt-4 divide-y divide-[var(--vemo-line)]">{items.slice(0, visible).map(item => <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0"><p className="break-words font-medium text-[var(--vemo-text)]">{item.title}</p><p className="mt-1 text-sm text-[var(--vemo-muted)]">{formatDate(item.createdAt)} às {timeLabel(item.createdAt)} · {item.undoneAt ? "Desfeita" : item.reversible ? "Pode ser desfeita" : "Registro protegido"}</p></div>{item.reversible && !item.undoneAt ? <Button type="button" variant="outline" className="min-h-10 shrink-0 rounded-full" disabled={working !== null} onClick={() => void undo(item)}>{working === item.id ? "Desfazendo…" : "Desfazer"}</Button> : null}</li>)}</ol>}
    {items.length > visible && <div className="pt-3 text-center"><Button type="button" variant="ghost" className="text-[var(--vemo-brand)]" onClick={() => setVisible(count => count + 20)}>Ver mais ({items.length - visible})</Button></div>}
  </section>;
}
