"use client";

import Link from "next/link";
import { ShieldCheck, Building2 } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { BusinessProfileSettings } from "@/components/business-profile-settings";
import { BusinessActivity } from "@/components/business-activity";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import styles from "@/components/settings-workspace.module.css";
import { SaasWorkspaceSettings } from "@/components/saas-workspace-settings";
import { canManageTeam } from "@/lib/saas-policy";

export default function SettingsPage() {
  const { user, loading, workspace, workspaceError } = useCurrentUser();
  const businessAllowed = !loading && !workspaceError && !["employee", "reception"].includes(workspace?.role ?? "") && (!workspace || workspace.entitlement.allowed);
  return <WorkspaceShell>
    <section className={`mx-auto w-full max-w-6xl space-y-7 px-5 py-8 sm:px-8 ${styles.settingsPage}`}>
      <header className={styles.pageHeader}><h1 className="text-3xl font-semibold">Configurações</h1><p>Conta, negócio e recebimentos em um só lugar.</p></header>
      <section className={`max-w-3xl ${styles.sectionCard}`} aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-xl font-semibold">Minha conta</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><dt className="text-sm text-gray-600">Nome</dt><dd className="mt-1 break-words font-medium">{user?.name}</dd></div>
          <div><dt className="text-sm text-gray-600">E-mail</dt><dd className="mt-1 break-all font-medium">{user?.email}</dd></div>
          <div><dt className="text-sm text-gray-600">Telefone</dt><dd className="mt-1 font-medium">{user?.phone || "Não informado"}</dd></div>
        </dl>
        <p className="mt-6 flex items-center gap-2 text-sm text-gray-600"><ShieldCheck className="size-5 shrink-0" aria-hidden="true" />{user?.emailVerifiedAt ? "E-mail confirmado" : "E-mail ainda não confirmado"}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {!user?.emailVerifiedAt && <Button asChild variant="outline" className="h-11"><Link href="/verificar-email">Confirmar e-mail</Link></Button>}
          <Button asChild variant="outline" className="h-11"><Link href="/esqueci-senha">Redefinir senha</Link></Button>
        </div>
      </section>
      <SaasWorkspaceSettings />
      {businessAllowed && <section className={`max-w-3xl ${styles.businessIntro}`} aria-labelledby="business-heading">
        <h2 id="business-heading" className="flex items-center gap-2 text-xl font-semibold"><Building2 className="size-5" aria-hidden="true" />Meu negócio</h2>
        <p className="mt-3 leading-7 text-gray-600">Configure os dados que aparecem para o cliente no pagamento.</p>
      </section>}
      {businessAllowed && (!workspace || canManageTeam(workspace.role)) && <BusinessProfileSettings />}
      {businessAllowed && workspace?.role !== "viewer" && <BusinessActivity />}
    </section>
  </WorkspaceShell>;
}
