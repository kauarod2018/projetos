"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeftRight, Building2, CheckCircle2, Copy, CreditCard, LockKeyhole, MailPlus, Save, Trash2, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canManageRole, canManageTeam, type WorkspaceRole, type WorkspaceSummary } from "@/lib/saas-policy";
import { useCurrentUser } from "@/hooks/use-current-user";
import styles from "./saas-workspace-settings.module.css";
import { SubscriptionSettings } from "@/components/subscription-settings";

type Member = { userId: number; name: string; email: string; role: WorkspaceRole };
type Invite = { id: string; email: string; role: WorkspaceRole; expiresAt: string };
type Companies = { enabled: boolean; activeId: number | null; workspaces: WorkspaceSummary[] };
export const roleNames: Record<WorkspaceRole, string> = { owner: "Proprietário", admin: "Administrador", editor: "Operador · acesso geral", viewer: "Leitor · acesso geral", employee: "Funcionário · próprio trabalho", reception: "Recepção · sem financeiro" };
const date = (value: string) => new Date(value).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export function SaasWorkspaceSettings() {
  const { user } = useCurrentUser();
  const [companies, setCompanies] = useState<Companies | null>(null);
  const [chosen, setChosen] = useState("");
  const [name, setName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer" | "employee" | "reception">("employee");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [feedbackArea, setFeedbackArea] = useState<"company" | "team">("company");
  const active = companies?.enabled ? companies.workspaces.find(company => company.id === companies.activeId) : undefined;
  const manage = active && canManageTeam(active.role);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/workspaces", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar suas empresas.");
      setCompanies(data);
      setChosen(String(data.activeId ?? ""));
      const company = data.workspaces?.find((item: WorkspaceSummary) => item.id === data.activeId);
      setName(company?.name ?? "");
      if (company && company.kind !== "individual" && canManageTeam(company.role)) {
        const response = await fetch("/api/workspaces/team", { cache: "no-store" });
        const team = await response.json();
        if (!response.ok) throw new Error(team.error || "Não foi possível carregar a equipe.");
        setMembers(team.members); setInvites(team.invites);
      } else { setMembers([]); setInvites([]); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível carregar suas empresas."); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function mutate(path: string, method: string, body: unknown, success: string, reload = false) {
    if (busy) return;
    setBusy(true); setError(""); setNotice(""); setFeedbackArea(path.includes("/team") ? "team" : "company");
    try {
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível concluir.");
      if (data.invitationUrl) { setInvitationUrl(data.invitationUrl); setEmail(""); }
      if (reload) { window.location.replace("/configuracoes"); return; }
      await load(); setNotice(success);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível concluir."); }
    finally { setBusy(false); }
  }

  async function copyLink() {
    setFeedbackArea("team"); setError("");
    try { await navigator.clipboard.writeText(invitationUrl); setNotice("Link copiado."); }
    catch { setError("Não foi possível copiar. O link está disponível no campo abaixo."); }
  }

  if (companies && !companies.enabled) return null;
  if (!companies) return error ? <section className={styles.section}><p role="alert" className={styles.error}>{error}</p><Button variant="outline" onClick={() => { setError(""); void load(); }}><RefreshCw aria-hidden="true" />Tentar novamente</Button></section> : <p role="status" className={styles.muted}>Carregando empresa…</p>;

  function invite(event: FormEvent) {
    event.preventDefault(); setInvitationUrl("");
    void mutate("/api/workspaces/team", "POST", { email, role }, "Convite criado. Compartilhe o link com a pessoa convidada.");
  }

  return <>
    <section className={styles.section} aria-labelledby="company-title">
      <h2 id="company-title" className={styles.row}><Building2 className="size-5" aria-hidden="true" />Empresa</h2>
      <div className={styles.form}>
        <div className={styles.field}><label htmlFor="active-company">Empresa ativa</label><select id="active-company" value={chosen} disabled={busy} onChange={event => setChosen(event.target.value)}>
          <option value="" disabled>Escolha uma empresa</option>
          {companies.workspaces.map(company => <option key={company.id} value={company.id}>{company.name} · {roleNames[company.role]}</option>)}
        </select></div>
        <div className={styles.row}><Button variant="outline" disabled={busy || !chosen || Number(chosen) === companies.activeId} onClick={() => void mutate("/api/workspaces", "POST", { workspaceId: Number(chosen) }, "", true)}><ArrowLeftRight aria-hidden="true" />Trocar empresa</Button>{active && <p className={styles.muted}>{roleNames[active.role]}</p>}</div>
      </div>
      {manage && <form className={styles.form} onSubmit={event => { event.preventDefault(); void mutate("/api/workspaces", "PATCH", { name }, "", true); }}>
        <div className={styles.field}><label htmlFor="company-name">Nome da empresa</label><input id="company-name" value={name} maxLength={120} minLength={2} required disabled={busy} onChange={event => setName(event.target.value)} /></div>
        <div className={styles.row}><Button disabled={busy || name.trim() === active.name}><Save aria-hidden="true" />Salvar nome</Button></div>
      </form>}
      {active?.role === "owner" && <fieldset className={styles.form}><legend className="pt-5 text-sm font-medium">Tipo de conta</legend><div className={styles.row}>{(["individual", "company"] as const).map(kind => <label key={kind} className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="workspace-kind" checked={(active.kind ?? "company") === kind} disabled={busy} onChange={() => { if (window.confirm(`Mudar para ${kind === "individual" ? "Individual" : "Empresa"}? O teste gratuito e a assinatura continuam com o mesmo prazo.`)) void mutate("/api/workspaces", "PATCH", { kind }, "", true); }} />{kind === "individual" ? "Individual" : "Empresa"}</label>)}</div></fieldset>}
      {active?.kind === "individual" && <p className={`mt-4 ${styles.muted}`}>Perfil Individual · sem equipe</p>}
      {error && feedbackArea === "company" && <p role="alert" className={`mt-4 ${styles.error}`}>{error}</p>}
      {notice && feedbackArea === "company" && <p role="status" className={`mt-4 ${styles.success}`}>{notice}</p>}
    </section>

    {active && !["employee", "reception"].includes(active.role) && <section id="assinatura" className={styles.section} aria-labelledby="subscription-title">
      <h2 id="subscription-title" className={styles.row}><CreditCard className="size-5" aria-hidden="true" />Assinatura</h2>
      <div className={styles.status} data-expired={!active.entitlement.allowed}>{active.entitlement.allowed ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <LockKeyhole className="size-5" aria-hidden="true" />}<div>
        <h3>{active.entitlement.state === "trial" ? "Teste gratuito ativo" : active.entitlement.state === "paid" ? "Assinatura ativa" : active.entitlement.state === "legacy" ? "Conta existente · acesso mantido" : "Assinatura necessária"}</h3>
        <p className={styles.muted}>{active.entitlement.state === "trial" ? `Grátis até ${date(active.entitlement.endsAt!)}. Sem cobrança automática.` : active.entitlement.state === "paid" ? `Acesso até ${date(active.entitlement.endsAt!)}.` : active.entitlement.state === "legacy" ? "Seu acesso atual foi preservado nesta migração." : "O período de acesso terminou. Seus dados estão preservados."}</p>
      </div></div>
      {active.entitlement.state !== "legacy" && <SubscriptionSettings key={active.id} company={active} verified={Boolean(user?.emailVerifiedAt)} />}
    </section>}

    {manage && active.kind !== "individual" && <section className={styles.section} aria-labelledby="team-title">
      <h2 id="team-title" className={styles.row}><Users className="size-5" aria-hidden="true" />Equipe</h2>
      <div className={`mt-4 ${styles.row}`}><Button asChild variant="outline"><Link href="/funcionarios"><Users aria-hidden="true" />Cadastrar funcionários</Link></Button></div>
      <ul className={styles.list}>{members.map(member => <li key={member.userId} className={styles.member}>
        <div><strong>{member.name}</strong><p className={styles.muted}>{member.email}</p></div>
        {canManageRole(active.role, member.role) && member.userId !== user?.id ? <>
          <select aria-label={`Permissão de ${member.name}`} value={member.role} disabled={busy || !active.entitlement.allowed} onChange={event => void mutate("/api/workspaces/team", "PATCH", { userId: member.userId, role: event.target.value }, "Permissão atualizada.")}>
            <option value="employee">Funcionário · próprio trabalho</option><option value="reception">Recepção · sem financeiro</option>{active.role === "owner" && <option value="admin">Administrador</option>}<option value="editor">Operador · acesso geral</option><option value="viewer">Leitor · acesso geral</option>
          </select>
          <Button variant="ghost" size="icon" disabled={busy} aria-label={`Remover ${member.name}`} title={`Remover ${member.name}`} onClick={() => { if (window.confirm(`Remover o acesso de ${member.name} a esta empresa?`)) void mutate("/api/workspaces/team", "DELETE", { userId: member.userId }, "Acesso removido."); }}><Trash2 aria-hidden="true" /></Button>
        </> : <span className={styles.muted}>{roleNames[member.role]}</span>}
      </li>)}</ul>
      <h3 className="mt-6">Convidar pessoa</h3>
      <form onSubmit={invite} className={styles.form}>
        <div className={styles.inviteFields}><div className={styles.field}><label htmlFor="invite-email">E-mail</label><input id="invite-email" type="email" autoComplete="email" value={email} maxLength={254} required disabled={busy || !active.entitlement.allowed || !user?.emailVerifiedAt} onChange={event => setEmail(event.target.value)} /></div>
          <div className={styles.field}><label htmlFor="invite-role">Permissão</label><select id="invite-role" value={role} disabled={busy || !active.entitlement.allowed || !user?.emailVerifiedAt} onChange={event => setRole(event.target.value as typeof role)}><option value="employee">Funcionário · próprio trabalho</option><option value="reception">Recepção · sem financeiro</option>{active.role === "owner" && <option value="admin">Administrador</option>}<option value="editor">Operador · acesso geral</option><option value="viewer">Leitor · acesso geral</option></select></div></div>
        {role === "employee" ? <p className={styles.muted}>Acesso apenas aos atendimentos atribuídos, incluindo contato e endereço necessários à execução.</p> : role === "reception" ? <p className={styles.muted}>Clientes, agenda e leitura dos relatórios. Sem financeiro, orçamentos ou administração da equipe.</p> : <p className={styles.error}>Este perfil permite consultar dados gerais da empresa, inclusive financeiros.</p>}
        {!user?.emailVerifiedAt && <p className={styles.muted}>Confirme seu e-mail para convidar pessoas.</p>}
        <div className={styles.row}><Button disabled={busy || !active.entitlement.allowed || !user?.emailVerifiedAt}><MailPlus aria-hidden="true" />{busy ? "Aguarde…" : "Criar convite"}</Button></div>
      </form>
      {invitationUrl && <div className={styles.linkBox}><label htmlFor="invitation-link">Link do convite · válido por 7 dias</label><input id="invitation-link" readOnly value={invitationUrl} onFocus={event => event.target.select()} /><div className={styles.row}><Button variant="outline" onClick={() => void copyLink()}><Copy aria-hidden="true" />Copiar link</Button></div></div>}
      {error && feedbackArea === "team" && <p role="alert" className={`mt-4 ${styles.error}`}>{error}</p>}
      {notice && feedbackArea === "team" && <p role="status" className={`mt-4 ${styles.success}`}>{notice}</p>}
      <h3 className="mt-7">Convites pendentes</h3>
      {invites.length === 0 ? <p className={styles.empty}>Nenhum convite pendente.</p> : <ul className={styles.list}>{invites.map(invitation => <li key={invitation.id} className={styles.member}><div><p>{invitation.email}</p><small>Expira em {date(invitation.expiresAt)}</small></div><span className={styles.muted}>{roleNames[invitation.role]}</span>{canManageRole(active.role, invitation.role) && <Button variant="ghost" size="icon" disabled={busy} aria-label={`Revogar convite de ${invitation.email}`} title="Revogar convite" onClick={() => { if (window.confirm("Revogar este convite?")) void mutate("/api/workspaces/team", "DELETE", { inviteId: invitation.id }, "Convite revogado."); }}><Trash2 aria-hidden="true" /></Button>}</li>)}</ul>}
    </section>}
  </>;
}
