"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatMoney, type Service } from "@/lib/models";
import { formatDuration } from "@/lib/service-catalog";

export function QuoteServicePicker({ initialServiceId, onAdd, disabled, canAdd }: {
  initialServiceId: string | null;
  onAdd: (service: Service) => void;
  disabled: boolean;
  canAdd: boolean;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const initialApplied = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    void fetch("/api/services", { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.services)) throw new Error("O catálogo está indisponível. Você pode preencher os itens manualmente.");
      if (!controller.signal.aborted) setServices(data.services.filter((service: Service) => !service.archived));
    }).catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Não foi possível carregar o catálogo."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    if (!initialServiceId || initialApplied.current === initialServiceId || loading || error || disabled || !canAdd) return;
    const service = services.find(item => String(item.id) === initialServiceId);
    initialApplied.current = initialServiceId;
    if (!service) { setNotice("Esse serviço não está disponível no catálogo ativo. Escolha outro ou preencha manualmente."); return; }
    onAdd(service);
    setNotice(`${service.name} adicionado ao orçamento.`);
  }, [initialServiceId, services, loading, error, disabled, canAdd, onAdd]);

  function add() {
    const service = services.find(item => String(item.id) === selection);
    if (!service) { setNotice("Escolha um serviço do catálogo."); document.getElementById("quote-service-select")?.focus(); return; }
    if (!canAdd || disabled) return;
    onAdd(service); setSelection(""); setNotice(`${service.name} adicionado ao orçamento.`);
  }

  if (loading) return <p role="status" className="py-2 text-sm text-gray-600">Carregando catálogo…</p>;
  if (error) return <div role="alert" className="border-l-2 border-amber-500 pl-3 text-sm text-gray-700"><p>{error}</p><Button type="button" variant="ghost" onClick={() => setRevision(value => value + 1)} className="mt-2 h-11"><RefreshCw className="size-4" aria-hidden="true" />Tentar novamente</Button></div>;
  return <div className="space-y-2">
    {services.length ? <>
      <Label htmlFor="quote-service-select">Serviço do catálogo</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select id="quote-service-select" disabled={disabled || !canAdd} value={selection} onChange={event => setSelection(event.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-base focus-visible:outline-blue-600">
          <option value="">Escolha um serviço</option>
          {services.map(service => <option key={service.id} value={service.id}>{service.name} · {formatMoney(service.priceCents)} · {formatDuration(service.durationMinutes)}</option>)}
        </select>
        <Button type="button" variant="outline" onClick={add} disabled={disabled || !canAdd} className="h-11 rounded-lg"><Plus className="size-4" aria-hidden="true" />Adicionar serviço</Button>
      </div>
      {!canAdd && <p className="text-sm text-gray-600">O limite é de 100 itens por orçamento.</p>}
    </> : <p className="text-sm text-gray-600">Nenhum serviço ativo no catálogo. <Link href="/servicos" className="font-medium text-blue-700 underline">Ver serviços</Link></p>}
    <p role="status" className="empty:hidden text-sm text-gray-600">{notice}</p>
  </div>;
}
