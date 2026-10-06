"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Archive, Clock3, FilePlus2, Package, Pencil, Plus, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney, type Service } from "@/lib/models";
import { formatDuration, parseServicePrice, serviceFieldsSchema, servicePriceInput } from "@/lib/service-catalog";
import styles from "@/components/service-catalog.module.css";

type Draft = { name: string; description: string; price: string; duration: string };
type Errors = Partial<Record<keyof Draft, string>>;
const blank: Draft = { name: "", description: "", price: "", duration: "" };

export function ServiceCatalog() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [requestKey, setRequestKey] = useState("");
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [target, setTarget] = useState<Service | null>(null);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setLoadError("");
    try {
      const response = await fetch("/api/services?incluirArquivados=1", { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.services)) throw new Error("Não foi possível carregar os serviços. Tente novamente.");
      if (!signal?.aborted && mounted.current) setServices(data.services);
    } catch (error) {
      if (!signal?.aborted && mounted.current) setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os serviços.");
    } finally { if (!signal?.aborted && mounted.current) setLoading(false); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void load(controller.signal);
    return () => { mounted.current = false; controller.abort(); };
  }, [load]);

  const query = search.trim().toLocaleLowerCase("pt-BR");
  const visible = services.filter(service => service.archived === archived && `${service.name} ${service.description}`.toLocaleLowerCase("pt-BR").includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || a.id - b.id);

  function rememberTrigger() { trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }
  function openForm(service: Service | null) {
    rememberTrigger(); setEditing(service); setErrors({}); setFormError(""); setNotice("");
    setRequestKey(crypto.randomUUID());
    setDraft(service ? { name: service.name, description: service.description, price: servicePriceInput(service.priceCents), duration: String(service.durationMinutes) } : blank);
    setFormOpen(true);
  }

  function applyService(service: Service) {
    setServices(current => [service, ...current.filter(item => item.id !== service.id)]);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    const price = parseServicePrice(draft.price);
    const duration = /^\d+$/.test(draft.duration.trim()) ? Number(draft.duration) : NaN;
    const result = serviceFieldsSchema.safeParse({ name: draft.name, description: draft.description, priceCents: price, durationMinutes: duration });
    if (!result.success) {
      const fieldErrors: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] === "priceCents" ? "price" : issue.path[0] === "durationMinutes" ? "duration" : issue.path[0] as keyof Draft;
        fieldErrors[key] ??= key === "price" && price === null ? "Informe um preço como 150,00." : key === "duration" && !Number.isFinite(duration) ? "Informe a duração em minutos inteiros." : issue.message;
      }
      setErrors(fieldErrors); setFormError("");
      const first = ["name", "description", "price", "duration"].find(key => fieldErrors[key as keyof Draft]);
      requestAnimationFrame(() => document.getElementById(`service-${first}`)?.focus());
      return;
    }
    setErrors({}); setFormError(""); busy.current = true; setSaving(true);
    try {
      const response = await fetch(editing ? `/api/services/${editing.id}` : "/api/services", {
        method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, ...(editing ? { version: editing.version } : { requestKey }) }),
      });
      const data = await response.json() as { service?: Service; error?: string };
      if (!response.ok || !data.service) throw new Error(data.error || "Não foi possível salvar. Seus dados continuam no formulário.");
      applyService(data.service); setFormOpen(false); setSearch(""); setArchived(data.service.archived);
      setNotice(editing ? "Serviço atualizado. Orçamentos anteriores foram mantidos." : "Serviço cadastrado.");
    } catch (error) { setFormError(error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente."); }
    finally { busy.current = false; setSaving(false); }
  }

  async function changeArchive() {
    if (!target || busy.current) return;
    busy.current = true; setSaving(true); setActionError("");
    try {
      const response = await fetch(`/api/services/${target.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: !target.archived, version: target.version }) });
      const data = await response.json() as { service?: Service; error?: string };
      if (!response.ok || !data.service) throw new Error(data.error || "Não foi possível atualizar o serviço.");
      applyService(data.service); setTarget(null);
      setNotice(data.service.archived ? "Serviço arquivado. Você pode reativá-lo na lista de arquivados." : "Serviço reativado.");
    } catch (error) { setActionError(error instanceof Error ? error.message : "Não foi possível atualizar o serviço."); }
    finally { busy.current = false; setSaving(false); }
  }

  const fieldProps = (key: keyof Draft) => ({ id: `service-${key}`, name: key, value: draft[key], "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `service-${key}-error` : undefined, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(current => ({ ...current, [key]: event.target.value })) });
  const fieldError = (key: keyof Draft) => errors[key] && <p id={`service-${key}-error`} className="text-sm text-red-700">{errors[key]}</p>;
  const restoreFocus = (event: Event) => { event.preventDefault(); if (trigger.current?.isConnected) trigger.current.focus(); else document.getElementById("service-search")?.focus(); };

  return <section className={`mx-auto w-full max-w-6xl space-y-6 px-5 py-8 sm:px-8 ${styles.servicesPage}`}>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-semibold">Serviços</h1><p className="mt-2 text-base text-gray-600">Seu catálogo de preços e durações.</p></div><Button onClick={() => openForm(null)} className="h-12 rounded-lg px-5 text-base"><Plus className="size-5" aria-hidden="true" />Novo serviço</Button></header>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full space-y-2 sm:max-w-sm"><Label htmlFor="service-search">Buscar serviço</Label><div className="relative"><Search className="absolute left-3 top-3 size-5 text-gray-400" aria-hidden="true" /><Input id="service-search" type="search" autoComplete="off" value={search} onChange={event => setSearch(event.target.value)} className="h-11 bg-white pl-10 text-base" placeholder="Nome ou descrição" /></div></div>
      <div role="group" aria-label="Situação dos serviços" className="flex w-fit gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {[false, true].map(value => <button key={String(value)} type="button" aria-pressed={archived === value} onClick={() => setArchived(value)} className={`min-h-10 rounded-md px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${archived === value ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>{value ? "Arquivados" : "Ativos"}</button>)}
      </div>
    </div>
    <p role="status" className="empty:hidden text-sm text-emerald-800">{notice}</p>
    {loading ? <p role="status" className="py-12 text-gray-600">Carregando serviços…</p> : loadError ? <div role="alert" className="border-l-4 border-red-600 bg-red-50 p-5 text-red-800"><p>{loadError}</p><Button variant="outline" className="mt-4 h-11" onClick={() => void load()}><RefreshCw className="size-4" aria-hidden="true" />Tentar novamente</Button></div> : <>
      <div className="flex items-center justify-between gap-3 text-sm text-gray-600"><p aria-live="polite">{visible.length} serviço{visible.length === 1 ? "" : "s"} {archived ? "arquivado" : "ativo"}{visible.length === 1 ? "" : "s"}</p><Button variant="ghost" size="icon" aria-label="Atualizar serviços" title="Atualizar serviços" onClick={() => void load()} className="size-11"><RefreshCw className="size-4" aria-hidden="true" /></Button></div>
      {visible.length ? <ul className="space-y-3">{visible.map(service => <li key={service.id} className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1"><h2 className="break-words text-lg font-semibold">{service.name}</h2>{service.description && <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-gray-600">{service.description}</p>}</div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end"><div><p className="text-lg font-semibold tabular-nums text-teal-700">{formatMoney(service.priceCents)}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600"><Clock3 className="size-4" aria-hidden="true" />{formatDuration(service.durationMinutes)}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            {!service.archived && <Button asChild variant="outline" className="h-11 rounded-lg"><Link href={`/novo-orcamento?servico=${service.id}`}><FilePlus2 className="size-4" aria-hidden="true" />Criar orçamento</Link></Button>}
            <Button variant="ghost" size="icon" className="size-11 rounded-lg" aria-label={`Editar ${service.name}`} title="Editar serviço" onClick={() => openForm(service)}><Pencil className="size-4" aria-hidden="true" /></Button>
            <Button variant="ghost" size="icon" className="size-11 rounded-lg" aria-label={`${service.archived ? "Reativar" : "Arquivar"} ${service.name}`} title={service.archived ? "Reativar serviço" : "Arquivar serviço"} onClick={() => { rememberTrigger(); setTarget(service); setActionError(""); setNotice(""); }}>{service.archived ? <RotateCcw className="size-4" aria-hidden="true" /> : <Archive className="size-4" aria-hidden="true" />}</Button>
          </div>
        </div>
      </li>)}</ul> : <div className="border-t border-gray-200 py-14 text-center"><Package className="mx-auto size-10 text-gray-400" aria-hidden="true" /><h2 className="mt-4 text-xl font-semibold">{query ? "Nenhum serviço encontrado" : archived ? "Nenhum serviço arquivado" : "Cadastre seu primeiro serviço"}</h2><p className="mt-2 text-gray-600">{query ? "Tente outro nome ou descrição." : archived ? "Seus serviços arquivados aparecerão aqui." : "Comece com o serviço que você mais realiza."}</p>{query ? <Button variant="outline" className="mt-5 h-11" onClick={() => setSearch("")}>Limpar busca</Button> : !archived && <Button className="mt-5 h-11" onClick={() => openForm(null)}><Plus className="size-4" aria-hidden="true" />Novo serviço</Button>}</div>}
    </>}

    <Dialog open={formOpen} onOpenChange={value => { if (!busy.current) setFormOpen(value); }}>
      <DialogContent showCloseButton={false} onCloseAutoFocus={restoreFocus} className="max-h-[90dvh] overflow-y-auto rounded-lg bg-white">
        <DialogHeader><DialogTitle className="pr-9">{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle><DialogDescription>{editing ? "A mudança não altera orçamentos já salvos." : "Defina o preço padrão e a duração estimada."}</DialogDescription></DialogHeader>
        <DialogClose disabled={saving} aria-label="Fechar formulário" title="Fechar" className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600"><X className="size-5" aria-hidden="true" /></DialogClose>
        <form onSubmit={save} noValidate className="space-y-5">
          <fieldset disabled={saving} className="space-y-5">
            <legend className="sr-only">Dados do serviço</legend>
            <div className="space-y-2"><Label htmlFor="service-name">Nome do serviço</Label><Input {...fieldProps("name")} required maxLength={120} autoComplete="off" className="h-11 text-base" placeholder="Ex.: Instalação de chuveiro" />{fieldError("name")}</div>
            <div className="space-y-2"><Label htmlFor="service-description">Descrição (opcional)</Label><Textarea {...fieldProps("description")} maxLength={300} rows={3} className="text-base" placeholder="O que está incluído no serviço" />{fieldError("description")}</div>
            <div className="space-y-2"><Label htmlFor="service-price">Preço padrão (R$)</Label><Input {...fieldProps("price")} required inputMode="decimal" autoComplete="off" maxLength={24} className="h-11 text-base" placeholder="150,00" />{fieldError("price")}</div>
            <div className="space-y-2"><Label htmlFor="service-duration">Duração estimada (minutos)</Label><Input {...fieldProps("duration")} required type="number" min={1} max={10080} step={1} inputMode="numeric" className="h-11 text-base" placeholder="60" />{fieldError("duration")}</div>
          </fieldset>
          {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setFormOpen(false)} className="h-11">Cancelar</Button><Button type="submit" disabled={saving} className="h-11" aria-live="polite">{saving ? "Salvando…" : "Salvar serviço"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(target)} onOpenChange={value => { if (!value && !busy.current) setTarget(null); }}>
      <DialogContent showCloseButton={false} onCloseAutoFocus={restoreFocus} className="max-h-[90dvh] overflow-y-auto rounded-lg bg-white">
        <DialogHeader><DialogTitle>{target?.archived ? "Reativar serviço?" : "Arquivar serviço?"}</DialogTitle><DialogDescription className="break-words">{target?.name}. {target?.archived ? "O serviço voltará ao catálogo ativo." : "O serviço sairá do catálogo ativo. Orçamentos anteriores serão mantidos e você poderá reativá-lo depois."}</DialogDescription></DialogHeader>
        {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
        <DialogFooter><Button autoFocus variant="outline" disabled={saving} onClick={() => setTarget(null)} className="h-11">Cancelar</Button><Button disabled={saving} onClick={() => void changeArchive()} className="h-11" aria-live="polite">{saving ? "Salvando…" : target?.archived ? "Reativar serviço" : "Arquivar serviço"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
