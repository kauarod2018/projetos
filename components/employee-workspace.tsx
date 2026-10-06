"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Archive, Check, Copy, MailPlus, Pencil, Play, Plus, RefreshCw, Save, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { canManageTeam } from "@/lib/saas-policy";
import styles from "./employee-workspace.module.css";
import { ServiceReportButton } from "./service-report";
import { EmployeeAvailability } from "./employee-availability";
import { availabilitySchema, type Availability } from "@/lib/scheduling-policy";

type Employee = { id: number; userId: number | null; name: string; email: string; phone: string; jobTitle: string; archived: boolean; version: number; availability?: string | null };
type Appointment = { id: number; title: string; customerName: string; customerPhone?: string | null; customerAddress?: string | null; startsAt: string; endsAt: string; status: string; version: number; employeeId?: number | null; instructions: string | null };
const emptyEmployee = { name: "", email: "", phone: "", jobTitle: "" };
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const time = (value: string) => value.slice(11, 16);

async function api(path: string, method = "GET", body?: unknown) {
  const response = await fetch(path, { method, cache: "no-store", ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir. Tente novamente.");
  return data;
}

function AssignmentForm({ appointment, employees, busy, save }: { appointment: Appointment; employees: Employee[]; busy: boolean; save: (id: number | null, instructions: string) => void }) {
  const [employeeId, setEmployeeId] = useState(String(appointment.employeeId ?? ""));
  const [instructions, setInstructions] = useState(appointment.instructions ?? "");
  const closed = ["Concluído", "Cancelado"].includes(appointment.status);
  return <form className={styles.assignment} onSubmit={event => { event.preventDefault(); save(employeeId ? Number(employeeId) : null, instructions); }}>
    <div className={styles.fields}>
      <div className={styles.field}><label htmlFor={`assignee-${appointment.id}`}>Responsável</label><select id={`assignee-${appointment.id}`} value={employeeId} disabled={busy || closed} onChange={event => setEmployeeId(event.target.value)}><option value="">Sem responsável</option>{employees.filter(employee => !employee.archived || employee.id === appointment.employeeId).map(employee => <option key={employee.id} value={employee.id} disabled={employee.archived}>{employee.name}{employee.archived ? " · arquivado" : ""}</option>)}</select></div>
      <label>Instruções para o funcionário<textarea value={instructions} maxLength={1000} rows={2} disabled={busy || closed || !employeeId} onChange={event => setInstructions(event.target.value)} /></label>
    </div>
    {!closed && <Button variant="outline" disabled={busy || (employeeId === String(appointment.employeeId ?? "") && instructions === (appointment.instructions ?? ""))}><Save aria-hidden="true" />Salvar responsável</Button>}
  </form>;
}

export function EmployeeWorkspace({ worker = false }: { worker?: boolean }) {
  const { user, loading: sessionLoading, workspace } = useCurrentUser();
  const authorized = Boolean(user && workspace?.entitlement.allowed && (worker ? workspace.role === "employee" : workspace.kind !== "individual" && canManageTeam(workspace.role)));
  const [tab, setTab] = useState<"directory" | "assignments">("directory");
  const [day, setDay] = useState(today);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyEmployee);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [schedule, setSchedule] = useState<Availability>({ days: [1,2,3,4,5], start: "08:00", end: "18:00" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");

  const load = useCallback(async () => {
    if (!authorized) return;
    setLoading(true); setError("");
    try {
      if (!worker) setEmployees((await api("/api/workspaces/employees")).employees);
      if (worker || tab === "assignments") setAppointments((await api(`${worker ? "/api/my-work" : "/api/workspaces/assignments"}?from=${day}&to=${day}`)).appointments);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível carregar."); }
    finally { setLoading(false); }
  }, [authorized, worker, tab, day]);
  useEffect(() => { void load(); }, [load]);

  async function mutate(path: string, method: string, body: unknown, success: string) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await api(path, method, body);
      if (data.invitationUrl) setInvitationUrl(data.invitationUrl);
      else { setFormOpen(false); setEditing(null); setForm(emptyEmployee); }
      await load(); setNotice(success);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível concluir."); }
    finally { setBusy(false); }
  }

  function saveEmployee(event: FormEvent) {
    event.preventDefault();
    const availability = scheduleEnabled ? schedule : null;
    if (scheduleEnabled && !availabilitySchema.safeParse(schedule).success) { setError("Escolha pelo menos um dia e um expediente com término posterior ao início."); return; }
    void mutate("/api/workspaces/employees", editing ? "PATCH" : "POST", editing ? { ...form, availability, id: editing.id, version: editing.version, archived: editing.archived } : { ...form, availability }, editing ? "Cadastro atualizado." : "Funcionário cadastrado. O acesso ainda não foi liberado.");
  }
  useEffect(() => {
    setScheduleEnabled(Boolean(editing?.availability));
    try { setSchedule(editing?.availability ? availabilitySchema.parse(JSON.parse(editing.availability)) : { days: [1,2,3,4,5], start: "08:00", end: "18:00" }); } catch { setScheduleEnabled(false); }
  }, [editing, formOpen]);

  if (sessionLoading) return <p role="status">Carregando sua conta…</p>;
  if (!authorized) return null;
  const visibleEmployees = employees.filter(employee => employee.archived === archived);
  return <div className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>{workspace?.name}</p><h1>{worker ? "Meu trabalho" : "Funcionários"}</h1></div><Button variant="outline" disabled={busy || loading} onClick={() => void load()}><RefreshCw aria-hidden="true" />Atualizar</Button></header>
    {!worker && <div role="tablist" aria-label="Funcionários" className={styles.tabs}>{(["directory", "assignments"] as const).map(value => <button key={value} id={`tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`panel-${value}`} tabIndex={tab === value ? 0 : -1} onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? "directory" : event.key === "End" ? "assignments" : tab === "directory" ? "assignments" : "directory"; setTab(next); document.getElementById(`tab-${next}`)?.focus(); } }} onClick={() => { setTab(value); setNotice(""); setInvitationUrl(""); }}>{value === "directory" ? "Equipe" : "Distribuição de atendimentos"}</button>)}</div>}
    {error && <div role="alert" className={styles.error}><p>{error}</p><Button variant="outline" disabled={busy} onClick={() => void load()}><RefreshCw aria-hidden="true" />Tentar novamente</Button></div>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {invitationUrl && <section className={styles.invite} aria-label="Convite criado"><h2>Convite pronto</h2><label>Link de acesso<input readOnly value={invitationUrl} onFocus={event => event.target.select()} /></label><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(invitationUrl); setNotice("Link copiado."); } catch { setError("Não foi possível copiar. Selecione o link acima."); } }}><Copy aria-hidden="true" />Copiar link</Button></section>}
    {!worker && tab === "directory" ? <section id="panel-directory" role="tabpanel" aria-labelledby="tab-directory">
      <div className={styles.toolbar}><label className={styles.toggle}><input type="checkbox" checked={archived} onChange={event => setArchived(event.target.checked)} />Arquivados</label><Button disabled={busy} onClick={() => { setEditing(null); setForm(emptyEmployee); setFormOpen(true); }}><Plus aria-hidden="true" />Novo funcionário</Button></div>
      {formOpen && <form className={styles.editor} onSubmit={saveEmployee}><div className={styles.heading}><h2>{editing ? "Editar funcionário" : "Novo funcionário"}</h2><Button type="button" variant="ghost" size="icon" title="Fechar cadastro" aria-label="Fechar cadastro" onClick={() => setFormOpen(false)} disabled={busy}><X aria-hidden="true" /></Button></div><div className={styles.fields}>
        <label>Nome<input autoFocus required minLength={2} maxLength={120} value={form.name} disabled={busy} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>E-mail<input type="email" required maxLength={254} readOnly={Boolean(editing)} value={form.email} disabled={busy} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
        <label>Telefone<input type="tel" maxLength={30} value={form.phone} disabled={busy} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
        <label>Cargo<input maxLength={120} value={form.jobTitle} disabled={busy} onChange={event => setForm({ ...form, jobTitle: event.target.value })} /></label>
      </div><fieldset className={styles.schedule}><legend>Disponibilidade</legend><label className={styles.toggle}><input type="checkbox" checked={scheduleEnabled} onChange={event => setScheduleEnabled(event.target.checked)} />Definir expediente</label>{scheduleEnabled && <><div className={styles.days}>{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label, day) => <label key={day}><input type="checkbox" checked={schedule.days.includes(day)} onChange={event => setSchedule(current => ({ ...current, days: event.target.checked ? [...current.days, day] : current.days.filter(value => value !== day) }))} />{label}</label>)}</div><div className={styles.fields}><label>Início do expediente<input type="time" required value={schedule.start} onChange={event => setSchedule({ ...schedule, start: event.target.value })} /></label><label>Fim do expediente<input type="time" required value={schedule.end} onChange={event => setSchedule({ ...schedule, end: event.target.value })} /></label></div></>}</fieldset><Button disabled={busy}><Save aria-hidden="true" />Salvar cadastro</Button></form>}
      {loading ? <p role="status" className={styles.empty}>Carregando equipe…</p> : !visibleEmployees.length ? <p className={styles.empty}>{archived ? "Nenhum funcionário arquivado." : "Nenhum funcionário cadastrado."}</p> : <ul className={styles.directory}>{visibleEmployees.map(employee => <li key={employee.id}><div className={styles.person}><h2>{employee.name}</h2><p>{employee.jobTitle || "Sem cargo informado"}</p><p className={styles.email}>{employee.email}</p><span className={styles.badge}>{employee.archived ? "Arquivado" : employee.userId ? "Conta vinculada" : "Sem conta vinculada"}</span></div><div className={styles.actions}>
        {!employee.archived && <><Button variant="ghost" size="icon" aria-label={`Editar ${employee.name}`} title="Editar cadastro" disabled={busy} onClick={() => { setEditing(employee); setForm({ name: employee.name, email: employee.email, phone: employee.phone, jobTitle: employee.jobTitle }); setFormOpen(true); }}><Pencil aria-hidden="true" /></Button>{!employee.userId && <Button variant="outline" disabled={busy} onClick={() => { setInvitationUrl(""); void mutate("/api/workspaces/team", "POST", { email: employee.email, role: "employee" }, "Compartilhe o convite com o funcionário."); }}><MailPlus aria-hidden="true" />Convidar</Button>}</>}
        <Button variant="ghost" size="icon" aria-label={`${employee.archived ? "Restaurar" : "Arquivar"} ${employee.name}`} title={employee.archived ? "Restaurar cadastro" : "Arquivar e revogar acesso"} disabled={busy} onClick={() => { if (window.confirm(employee.archived ? "Restaurar o cadastro? Será necessário um novo convite para liberar acesso." : "Arquivar este funcionário e revogar seu acesso? O histórico será preservado.")) void mutate("/api/workspaces/employees", "PATCH", { name: employee.name, email: employee.email, phone: employee.phone, jobTitle: employee.jobTitle, id: employee.id, version: employee.version, archived: !employee.archived }, employee.archived ? "Cadastro restaurado. Libere o acesso com um novo convite." : "Funcionário arquivado e acesso revogado."); }}>{employee.archived ? <Undo2 aria-hidden="true" /> : <Archive aria-hidden="true" />}</Button>
      </div></li>)}</ul>}
      {!loading && <EmployeeAvailability employees={employees.filter(employee => !employee.archived)} />}
    </section> : <section {...(!worker ? { id: "panel-assignments", role: "tabpanel", "aria-labelledby": "tab-assignments" } : {})}>
      <div className={styles.toolbar}><label className={styles.date}>Data<input type="date" required value={day} disabled={busy} onChange={event => { if (event.target.value) setDay(event.target.value); }} /></label><span className={styles.count}>{appointments.length} atendimento{appointments.length !== 1 ? "s" : ""}</span></div>
      {loading ? <p role="status" className={styles.empty}>Carregando atendimentos…</p> : !appointments.length ? <p className={styles.empty}>{worker ? "Nenhum atendimento atribuído a você nesta data." : "Nenhum atendimento nesta data."}</p> : <ul className={styles.jobs}>{appointments.map(appointment => <li key={`${appointment.id}-${appointment.version}`}><div className={styles.jobHeading}><div><p className={styles.time}>{time(appointment.startsAt)} – {time(appointment.endsAt)}</p><h2>{appointment.title}</h2><p className={styles.customer}>{appointment.customerName}</p></div><span className={styles.badge} data-complete={appointment.status === "Concluído"}>{appointment.status}</span></div>
        {worker ? <>{appointment.customerAddress && <p className={styles.instructions}>{appointment.customerAddress}</p>}{appointment.customerPhone && <a className={styles.contact} href={`tel:${appointment.customerPhone.replace(/[^\d+]/g, "")}`}>{appointment.customerPhone}</a>}{appointment.instructions && <p className={styles.instructions}>{appointment.instructions}</p>}<div className={styles.actions}><ServiceReportButton id={appointment.id} title={appointment.title} />{["Agendado", "Confirmado", "Em atendimento"].includes(appointment.status) && <Button variant={appointment.status === "Em atendimento" ? "default" : "outline"} disabled={busy} onClick={() => { const status = appointment.status === "Em atendimento" ? "Concluído" : "Em atendimento"; if (status !== "Concluído" || window.confirm("Concluir este atendimento? Isso não registra pagamento.")) void mutate("/api/my-work", "PATCH", { appointmentId: appointment.id, version: appointment.version, status }, status === "Concluído" ? "Atendimento concluído." : "Atendimento iniciado."); }}>{appointment.status === "Em atendimento" ? <Check aria-hidden="true" /> : <Play aria-hidden="true" />}{appointment.status === "Em atendimento" ? "Concluir atendimento" : "Iniciar atendimento"}</Button>}</div></> : <AssignmentForm appointment={appointment} employees={employees} busy={busy} save={(employeeId, instructions) => void mutate("/api/workspaces/assignments", "POST", { appointmentId: appointment.id, employeeId, instructions, version: appointment.version }, "Responsável atualizado.")} />}
      </li>)}</ul>}
      {!loading && appointments.length === 250 && <p role="status" className={styles.empty}>Limite de 250 atendimentos nesta data. Entre em contato com o responsável.</p>}
    </section>}
  </div>;
}
