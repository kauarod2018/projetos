"use client";

import Link from "next/link";
import { Building2, History, ImagePlus, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { BusinessProfileSettings } from "@/components/business-profile-settings";
import { BusinessLogoSettings } from "@/components/business-logo-settings";
import { BusinessActivity } from "@/components/business-activity";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import styles from "@/components/settings-workspace.module.css";
import { SaasWorkspaceSettings } from "@/components/saas-workspace-settings";
import { canManageTeam } from "@/lib/saas-policy";

export default function SettingsPage() {
  const { user, loading, workspace, workspaceError } = useCurrentUser();
  const businessAllowed = !loading && !workspaceError && !["employee", "reception"].includes(workspace?.role ?? "") && (!workspace || workspace.entitlement.allowed);
  const manageBusiness = businessAllowed && (!workspace || canManageTeam(workspace.role));
  const initials = (user?.name ?? "").split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "V";
  const sections = [
    ...(manageBusiness ? [{ href: "#logo", label: "Logo da empresa", icon: ImagePlus }, { href: "#pix", label: "Recebimento por Pix", icon: KeyRound }] : []),
    { href: "#empresa", label: "Empresa e assinatura", icon: Building2 },
    { href: "#conta", label: "Minha conta", icon: UserRound },
    ...(businessAllowed && workspace?.role !== "viewer" ? [{ href: "#historico", label: "Histórico de ações", icon: History }] : []),
  ];
  return <WorkspaceShell>
    <section className={styles.settingsPage}>
      <header className={styles.pageHeader}><h1>Configurações</h1><p>Sua conta, sua empresa e como você recebe dos clientes.</p></header>
      <div className={styles.layout}>
        <nav className={styles.sideNav} aria-label="Seções das configurações">
          {sections.map(({ href, label, icon: Icon }) => <a key={href} href={href}><Icon aria-hidden="true" />{label}</a>)}
        </nav>
        <div className={styles.stack}>
          {manageBusiness && <BusinessLogoSettings businessName={workspace?.name} />}
          {manageBusiness && <div id="pix"><BusinessProfileSettings /></div>}
          <div id="empresa" className={styles.saasArea}><SaasWorkspaceSettings /></div>
          <section id="conta" className={styles.card} aria-labelledby="account-heading">
            <div className={styles.cardHead}>
              <span className={styles.avatar} aria-hidden="true">{initials}</span>
              <div><h2 id="account-heading">Minha conta</h2><p>Seus dados de acesso ao Vemo.</p></div>
            </div>
            <dl className={styles.details}>
              <div><dt>Nome</dt><dd>{user?.name}</dd></div>
              <div><dt>E-mail</dt><dd className="break-all">{user?.email}</dd></div>
              <div><dt>Telefone</dt><dd>{user?.phone || "Não informado"}</dd></div>
              <div><dt>Segurança</dt><dd className={styles.verified} data-ok={Boolean(user?.emailVerifiedAt) || undefined}><ShieldCheck aria-hidden="true" />{user?.emailVerifiedAt ? "E-mail confirmado" : "E-mail não confirmado"}</dd></div>
            </dl>
            <div className={styles.actionsRow}>
              {!user?.emailVerifiedAt && <Button asChild variant="outline" className="h-11 rounded-full px-5"><Link href="/verificar-email">Confirmar e-mail</Link></Button>}
              <Button asChild variant="outline" className="h-11 rounded-full px-5"><Link href="/esqueci-senha">Trocar senha</Link></Button>
            </div>
          </section>
          {businessAllowed && workspace?.role !== "viewer" && <div id="historico"><BusinessActivity /></div>}
        </div>
      </div>
    </section>
  </WorkspaceShell>;
}
