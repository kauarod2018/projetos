"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { appointmentFieldsSchema, endOfAppointment, type Appointment, type AppointmentRecurrence } from "@/lib/appointments";
import { formatDate, type Customer, type Service } from "@/lib/models";
import { useCurrentUser } from "@/hooks/use-current-user";

type AppointmentFields = ReturnType<typeof appointmentFieldsSchema.parse>;
type Review = { fields: AppointmentFields; customerName: string; customerPhone: string; serviceName: string; recurrence: AppointmentRecurrence; recurrenceCount: number };
const normalizeCustomerName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");

export function AppointmentForm({ appointment, day, initialQuoteId, initialCustomerId, initialCustomerName, initialStartAt, reviewBeforeSave = false, onSaved, onCancel, onBusy }: { appointment: Appointment | null; day: string; initialQuoteId?: number; initialCustomerId?: number; initialCustomerName?: string; initialStartAt?: string; reviewBeforeSave?: boolean; onSaved: (appointment: Appointment, seriesCount?: number) => void; onCancel: () => void; onBusy: (value: boolean) => void }) {
  const { workspace, loading: sessionLoading } = useCurrentUser();
  const company = workspace?.kind === "company";
  const [employees, setEmployees] = useState<{ id: number; name: string; archived: boolean }[]>([]);
  const [employeeId, setEmployeeId] = useState(String(appointment?.employeeId ?? ""));
  const [quoteReady, setQuoteReady] = useState(!initialQuoteId);
  const [quoteError, setQuoteError] = useState("");
  const [customerId, setCustomerId] = useState(String(appointment?.customerId ?? initialCustomerId ?? ""));
  const [serviceId, setServiceId] = useState(String(appointment?.serviceId ?? ""));
  const [title, setTitle] = useState(appointment?.title ?? "");
  const [date, setDate] = useState(appointment?.startsAt.slice(0, 10) ?? initialStartAt?.slice(0, 10) ?? day);
  const [time, setTime] = useState(appointment?.startsAt.slice(11) ?? initialStartAt?.slice(11) ?? "09:00");
  const [duration, setDuration] = useState(String(appointment?.durationMinutes ?? 60));
  const [notes, setNotes] = useState(appointment?.notes ?? "");
  const [recurrence, setRecurrence] = useState<AppointmentRecurrence>("none");
  const [recurrenceCount, setRecurrenceCount] = useState("4");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [serviceError, setServiceError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<Record<string, string>>({});
  const [review, setReview] = useState<Review | null>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const busy = useRef(false);
  const initialCustomerResolved = useRef(false);
  const key = useRef("");
  useEffect(() => { if (review) reviewRef.current?.focus(); }, [review]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(""); setServiceError(false);
    const get = async (url: string, field: string) => { const res = await fetch(url, { signal: controller.signal, cache: "no-store" }); const data = await res.json(); if (!res.ok || !Array.isArray(data[field])) throw new Error(); return data[field]; };
    if (sessionLoading) return () => controller.abort();
    void Promise.allSettled([get("/api/customers", "customers"), get("/api/services?incluirArquivados=1", "services"), company ? get("/api/workspaces/employees", "employees") : Promise.resolve([])]).then(([clients, catalog, team]) => {
      if (controller.signal.aborted) return;
      if (clients.status === "fulfilled") setCustomers(clients.value); else setLoadError("Não foi possível carregar os clientes.");
      if (catalog.status === "fulfilled") setServices(catalog.value); else setServiceError(true);
      if (team.status === "fulfilled") setEmployees(team.value); else setLoadError("Não foi possível carregar os responsáveis. Atualize antes de agendar.");
      setLoading(false);
    });
    return () => controller.abort();
  }, [revision, sessionLoading, company]);
  useEffect(() => {
    if (!initialQuoteId) return;
    const controller = new AbortController(); setQuoteReady(false); setQuoteError("");
    void fetch(`/api/quotes/${initialQuoteId}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok || !data.quote) throw new Error(data.error || "Orçamento indisponível.");
      if (!controller.signal.aborted) { setCustomerId(String(data.quote.customerId)); setTitle(data.quote.description.slice(0, 120)); setQuoteReady(true); }
    }).catch(failure => { if (!controller.signal.aborted) setQuoteError(failure.message); });
    return () => controller.abort();
  }, [initialQuoteId, revision]);
  useEffect(() => {
    if (appointment || initialCustomerId || !initialCustomerName || loading || initialCustomerResolved.current) return;
    initialCustomerResolved.current = true;
    const expected = normalizeCustomerName(initialCustomerName);
    const exactMatches = customers.filter(customer => normalizeCustomerName(customer.name) === expected);
    if (exactMatches.length === 1) setCustomerId(String(exactMatches[0].id));
  }, [customers, appointment, initialCustomerId, initialCustomerName, loading]);

  async function save(event: FormEvent) {
    event.preventDefault(); if (busy.current || loading || loadError || !quoteReady || sessionLoading) return;
    const parsed = appointmentFieldsSchema.safeParse({ customerId: Number(customerId), serviceId: serviceId ? Number(serviceId) : null, title, startsAt: `${date}T${time}`, durationMinutes: Number(duration), notes, employeeId: employeeId ? Number(employeeId) : null });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      const messages: Record<string, string> = { customerId: "Escolha um cliente.", title: "Informe o assunto (até 120 caracteres).", startsAt: "Confira a data e o horário.", durationMinutes: "Informe de 1 a 1.440 minutos inteiros.", notes: "Use até 1.000 caracteres." };
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = messages[String(issue.path[0])] ?? "Confira este campo.";
      setInvalid(errors); setError("");
      requestAnimationFrame(() => document.getElementById(`appointment-${Object.keys(errors)[0]}`)?.focus()); return;
    }
    setInvalid({}); setError("");
    if (reviewBeforeSave) {
      const customer = customers.find(item => item.id === parsed.data.customerId);
      if (!customer) { setInvalid({ customerId: "Escolha um cliente disponível." }); document.getElementById("appointment-customerId")?.focus(); return; }
      setReview({ fields: parsed.data, customerName: customer.name, customerPhone: customer.phone, serviceName: services.find(item => item.id === parsed.data.serviceId)?.name ?? "", recurrence, recurrenceCount: Number(recurrenceCount) });
      return;
    }
    await submit(parsed.data);
  }

  async function submit(fields: AppointmentFields) {
    if (busy.current) return;
    setError(""); busy.current = true; setSaving(true); onBusy(true);
    key.current ||= crypto.randomUUID();
    try {
      const response = await fetch(appointment ? `/api/appointments/${appointment.id}` : "/api/appointments", { method: appointment ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, ...(appointment ? { version: appointment.version } : { requestKey: key.current, recurrence, recurrenceCount: recurrence === "none" ? 1 : Number(recurrenceCount), ...(initialQuoteId ? { quoteId: initialQuoteId } : {}) }) }) });
      const data = await response.json();
      if (!response.ok || !data.appointment) throw new Error(data.error || "Não foi possível salvar. Tente novamente.");
      onSaved(data.appointment, data.seriesCount);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível salvar."); }
    finally { busy.current = false; setSaving(false); onBusy(false); }
  }
  const clearInvalid = (...names: string[]) => setInvalid(current => Object.fromEntries(Object.entries(current).filter(([name]) => !names.includes(name))));
  const field = (name: string) => ({ name, id: `appointment-${name}`, "aria-invalid": Boolean(invalid[name]), "aria-describedby": invalid[name] ? `error-${name}` : undefined });
  const message = (name: string) => invalid[name] && <p id={`error-${name}`} className="text-sm text-red-700">{invalid[name]}</p>;
  const selectClass = "h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-base focus-visible:outline-blue-600";
  const matchingCustomers = initialCustomerName ? customers.filter(customer => normalizeCustomerName(customer.name) === normalizeCustomerName(initialCustomerName)) : [];
  if (review) {
    const end = endOfAppointment(review.fields.startsAt, review.fields.durationMinutes);
    const edit = () => { setReview(null); setError(""); requestAnimationFrame(() => document.getElementById("appointment-customerId")?.focus()); };
    return <section className="space-y-5" aria-labelledby="appointment-review-heading">
      <h3 id="appointment-review-heading" ref={reviewRef} tabIndex={-1} className="text-lg font-semibold outline-offset-2">Revisar agendamento</h3>
      <dl className="space-y-4 text-sm">
        <div><dt className="text-gray-500">Cliente · cadastro #{review.fields.customerId}</dt><dd className="mt-1 break-words font-semibold">{review.customerName}</dd>{review.customerPhone && <dd className="mt-1 break-words text-gray-600">{review.customerPhone}</dd>}</div>
        <div><dt className="text-gray-500">Serviço ou assunto</dt><dd className="mt-1 whitespace-pre-line break-words font-semibold">{review.fields.title}</dd>{review.serviceName && <dd className="mt-1 break-words text-gray-600">Catálogo: {review.serviceName}</dd>}</div>
        {company && <div><dt className="text-gray-500">Responsável</dt><dd className="mt-1 break-words font-semibold">{employees.find(employee => employee.id === review.fields.employeeId)?.name ?? "Sem responsável"}</dd></div>}
        <div><dt className="text-gray-500">Início · Brasília</dt><dd className="mt-1 font-semibold">{formatDate(review.fields.startsAt)} às {review.fields.startsAt.slice(11)}</dd></div>
        <div><dt className="text-gray-500">Término · Brasília</dt><dd className="mt-1 font-semibold">{formatDate(end)} às {end.slice(11)} · {review.fields.durationMinutes} min</dd></div>
        {review.recurrence !== "none" && <div><dt className="text-gray-500">Repetição</dt><dd className="mt-1 font-semibold">{review.recurrenceCount} ocorrências · {review.recurrence === "weekly" ? "semanal" : review.recurrence === "biweekly" ? "a cada 2 semanas" : "mensal"}</dd></div>}
        {review.fields.notes && <div><dt className="text-gray-500">Observações</dt><dd className="mt-1 whitespace-pre-line break-words">{review.fields.notes}</dd></div>}
      </dl>
      <p className="text-sm leading-6 text-gray-600">O horário será conferido ao confirmar. O atendimento ficará como Agendado, sem envio de mensagem ou registro de pagamento.</p>
      {error && <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex flex-col gap-2"><Button className="h-11" disabled={saving} onClick={() => void submit(review.fields)}>{saving ? "Agendando..." : "Confirmar agendamento"}</Button><Button variant="outline" className="h-11" disabled={saving} onClick={edit}>Voltar e editar</Button><Button variant="ghost" className="h-11" disabled={saving} onClick={onCancel}>Cancelar</Button></div>
    </section>;
  }
  return <form onSubmit={save} onChangeCapture={event => { const target = event.target; if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) clearInvalid(target.name); }} noValidate className="space-y-4">
    {loading && <p role="status">Carregando clientes e serviços…</p>}
    {loadError && <div role="alert"><p>{loadError}</p><Button type="button" variant="outline" onClick={() => setRevision(v => v + 1)}>Tentar novamente</Button></div>}
    {quoteError && <div role="alert"><p>{quoteError}</p><Button type="button" variant="outline" onClick={() => setRevision(v => v + 1)}>Tentar novamente</Button></div>}
    {!loading && !loadError && !customers.length && <p>Cadastre um cliente antes de agendar. <Link href="/clientes?novo=1" className="text-blue-700 underline">Cadastrar cliente</Link></p>}
    <fieldset disabled={saving || loading || sessionLoading || !quoteReady || Boolean(loadError)} className="space-y-4">
      <legend className="sr-only">Dados do compromisso</legend>
      <div className="space-y-2"><Label htmlFor="appointment-customerId">Cliente</Label>{initialCustomerName && <p className="text-sm text-gray-600">{matchingCustomers.length === 1 ? `Único cadastro encontrado para ${initialCustomerName}; confira a seleção.` : matchingCustomers.length > 1 ? `Encontrei ${matchingCustomers.length} clientes chamados ${initialCustomerName}. Escolha o cadastro correto.` : `Não encontrei ${initialCustomerName} no cadastro. Escolha um cliente disponível.`}</p>}<select {...field("customerId")} disabled={Boolean(initialQuoteId || appointment?.quoteId)} className={selectClass} value={customerId} onChange={e => setCustomerId(e.target.value)} required><option value="">Escolha um cliente</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone || `#${c.id}`}</option>)}</select>{message("customerId")}</div>
      {company && <div className="space-y-2"><Label htmlFor="appointment-employeeId">Responsável</Label><select id="appointment-employeeId" className={selectClass} value={employeeId} onChange={event => setEmployeeId(event.target.value)}><option value="">Minha agenda / sem funcionário</option>{employees.filter(employee => !employee.archived || employee.id === appointment?.employeeId).map(employee => <option key={employee.id} value={employee.id} disabled={employee.archived}>{employee.name}{employee.archived ? " · arquivado" : ""}</option>)}</select></div>}
      {(initialQuoteId || appointment?.quoteId) && <p className="text-sm text-blue-800">Orçamento #{initialQuoteId || appointment?.quoteId} vinculado a este atendimento.</p>}
      <div className="space-y-2"><Label htmlFor="appointment-serviceId">Serviço do catálogo (opcional)</Label><select {...field("serviceId")} className={selectClass} value={serviceId} onChange={e => { setServiceId(e.target.value); const service = services.find(s => String(s.id) === e.target.value); if (service) { setTitle(service.name); setDuration(String(service.durationMinutes)); clearInvalid("title", "durationMinutes"); } }}><option value="">Sem serviço do catálogo</option>{services.filter(s => !s.archived || s.id === appointment?.serviceId).map(s => <option key={s.id} value={s.id}>{s.name}{s.archived ? " (arquivado)" : ""}</option>)}{serviceError && serviceId && <option value={serviceId}>Serviço atual</option>}</select>{serviceError && <p className="text-sm text-amber-800">Catálogo indisponível. Você pode preencher o assunto e a duração manualmente.</p>}</div>
      <div className="space-y-2"><Label htmlFor="appointment-title">Serviço ou assunto</Label><Input {...field("title")} value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} className="h-11" />{message("title")}</div>
      <div className="grid grid-cols-2 gap-3"><div className="min-w-0 space-y-2"><Label htmlFor="appointment-startsAt">Data</Label><Input {...field("startsAt")} type="date" min="2000-01-01" max="2099-12-31" value={date} onChange={e => setDate(e.target.value)} required className="h-11" /></div><div className="min-w-0 space-y-2"><Label htmlFor="appointment-time">Horário</Label><Input id="appointment-time" name="startsAt" type="time" step={60} value={time} onChange={e => setTime(e.target.value)} required aria-invalid={Boolean(invalid.startsAt)} aria-describedby={invalid.startsAt ? "error-startsAt" : undefined} className="h-11" /></div></div>{message("startsAt")}
      <p className="text-xs text-gray-600">Horário de Brasília (America/Sao_Paulo).</p>
      <div className="space-y-2"><Label htmlFor="appointment-durationMinutes">Duração (minutos)</Label><Input {...field("durationMinutes")} type="number" min={1} max={1440} step={1} value={duration} onChange={e => setDuration(e.target.value)} required className="h-11" />{message("durationMinutes")}</div>
      {!appointment && !initialQuoteId && <fieldset className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2"><legend className="px-1 text-sm font-medium">Repetição</legend><div className="space-y-2"><Label htmlFor="appointment-recurrence">Frequência</Label><select id="appointment-recurrence" name="recurrence" className={selectClass} value={recurrence} onChange={event => setRecurrence(event.target.value as AppointmentRecurrence)}><option value="none">Não repetir</option><option value="weekly">Toda semana</option><option value="biweekly">A cada 2 semanas</option><option value="monthly">Todo mês</option></select></div>{recurrence !== "none" && <div className="space-y-2"><Label htmlFor="appointment-recurrenceCount">Quantidade de ocorrências</Label><Input id="appointment-recurrenceCount" name="recurrenceCount" type="number" min={2} max={24} step={1} value={recurrenceCount} onChange={event => setRecurrenceCount(event.target.value)} required className="h-11" /><p className="text-xs text-slate-600">Até 24 atendimentos. Todos serão conferidos antes de salvar.</p></div>}</fieldset>}
      <div className="space-y-2"><Label htmlFor="appointment-notes">Observações (opcional)</Label><Textarea {...field("notes")} value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} rows={3} />{message("notes")}</div>
    </fieldset>
    {error && <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" className="h-11" onClick={onCancel} disabled={saving}>Cancelar</Button><Button type="submit" className="h-11" disabled={saving || loading || sessionLoading || !quoteReady || Boolean(loadError) || !customers.length}>{saving ? "Salvando…" : reviewBeforeSave ? "Revisar agendamento" : appointment ? "Salvar alterações" : "Agendar"}</Button></div>
  </form>;
}
