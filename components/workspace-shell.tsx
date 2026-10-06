"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  CalendarDays,
  FileText,
  Package,
  Settings,
  LogOut,
  Users,
  WalletCards,
  X,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { VemoMark, VemoWordmark } from "@/components/vemo-brand";
import { useCurrentUser, type CurrentUser } from "@/hooks/use-current-user";
import { isWorkspaceRouteActive, workspaceNavigation, employeeNavigation, receptionNavigation } from "@/lib/workspace-navigation";
import { canManageTeam, type WorkspaceSummary } from "@/lib/saas-policy";
import { WorkspaceAssistant } from "@/components/workspace-assistant";
import { AssistantProvider } from "@/components/assistant-context";
import styles from "./workspace-shell.module.css";
import saasStyles from "./saas-workspace-settings.module.css";

const icons = { home: Home, clients: Users, calendar: CalendarDays, finance: WalletCards, quotes: FileText, services: Package, settings: Settings };

function navigation(workspace: WorkspaceSummary | null) {
  if (workspace?.role === "employee") return employeeNavigation;
  if (workspace?.role === "reception") return receptionNavigation;
  return workspace && workspace.kind !== "individual" && canManageTeam(workspace.role) ? [...workspaceNavigation.slice(0, -1), { label: "Funcionários", href: "/funcionarios", icon: "clients" as const }, workspaceNavigation.at(-1)!] : workspaceNavigation;
}

function WorkspaceNavigation({ user, workspace }: { user: CurrentUser; workspace: WorkspaceSummary | null }) {
  const pathname = usePathname();
  const [logoutError, setLogoutError] = useState("");
  const { setOpenMobile } = useSidebar();
  const initials = user?.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "VE";

  async function logout() {
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      // A full navigation discards the previous account's client-side data.
      window.location.replace("/");
    } catch {
      setLogoutError("Não foi possível sair. Tente novamente.");
    }
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className={`border-r border-[#17324e] ${styles.navigation}`}
    >
      <SidebarHeader className="relative border-b border-[#edf1f6] px-5 py-5">
        <Link
          href={workspace?.role === "employee" ? "/meu-trabalho" : workspace?.role === "reception" ? "/agenda" : "/hoje"}
          aria-label="Vemo, ir para início"
          className="block max-w-[calc(100%-2.75rem)] rounded-md focus-visible:outline-2 focus-visible:outline-[#1765dc]"
          onClick={() => setOpenMobile(false)}
        >
          <span className="block min-w-0">
            <VemoWordmark className="h-11 w-40 max-w-full" />
          </span>
        </Link>
        <p title={workspace?.name} className="mt-3 line-clamp-2 max-w-[11rem] break-words text-sm leading-5 text-[#9fb6d1]">
          {workspace?.name ?? "Seu negócio em dia, sem perder o ritmo."}
        </p>
        <button
          type="button"
          onClick={() => setOpenMobile(false)}
          aria-label="Fechar menu"
          title="Fechar menu"
          className="absolute right-3 top-5 flex size-10 items-center justify-center rounded-md border border-[#24445f] text-[#c5d8ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48cdd8] md:hidden"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <nav aria-label="Menu principal" className="h-full">
        <p className="px-3 pb-2 pt-1 text-[0.68rem] font-semibold uppercase text-[#7f98b7]">Seu negócio</p>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation(workspace).map((item) => {
                const isActive = isWorkspaceRouteActive(pathname, item.href);
                const Icon = icons[item.icon];

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-11 rounded-md border border-transparent px-3 text-[0.925rem] text-[#c5d8ec] hover:bg-[#102d49] hover:text-white data-[active=true]:border-[#1f7ae8] data-[active=true]:bg-[#0f62e6] data-[active=true]:font-semibold data-[active=true]:text-white focus-visible:ring-[#48cdd8]"
                    >
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setOpenMobile(false)}
                      >
                        <Icon className="size-[1.125rem]" aria-hidden="true" />
                        <span>{item.label}</span>
                        {"upcoming" in item && <span className="ml-auto text-xs font-normal text-[#64748b]">Em breve</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#edf1f6] p-3">
        {user && !user.emailVerifiedAt && <Link href="/verificar-email" className="px-2 text-sm font-medium text-[#9dc5ff] underline-offset-4 hover:underline">Confirmar meu e-mail</Link>}
        {logoutError && <p role="alert" className="text-sm text-[#ffb8c8]">{logoutError}</p>}
        <div className="flex items-center gap-3 rounded-md bg-[#0f2a44] p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#4ad5da] text-sm font-semibold text-[#061421]">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-[#f4f9ff]">{user?.name ?? "Minha conta"}</span>
            <span className="block truncate text-xs text-[#9fb6d1]">{user?.email ?? "Profissional autônomo"}</span>
          </span>
          <button
            type="button"
            onClick={logout}
            className="ml-auto flex size-10 shrink-0 items-center justify-center rounded-md text-[#9fb6d1] hover:bg-[#173b5e] hover:text-[#ff9cae] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48cdd8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07182b]"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, workspace, workspaceError } = useCurrentUser();
  const blocked = Boolean(workspaceError || (workspace && !workspace.entitlement.allowed));
  const employee = workspace?.role === "employee";
  const reception = workspace?.role === "reception";
  const forbiddenPage = reception ? !(pathname === "/agenda" || pathname === "/configuracoes" || pathname === "/clientes") : employee ? !["/meu-trabalho", "/configuracoes"].includes(pathname) : pathname === "/meu-trabalho" || (pathname === "/funcionarios" && (!workspace || workspace.kind === "individual" || !canManageTeam(workspace.role)));
  const currentPage = navigation(workspace).find((item) => isWorkspaceRouteActive(pathname, item.href));
  const lightTheme = true;

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, router, user]);
  useEffect(() => {
    if (!loading && user && pathname === "/hoje" && (employee || reception)) router.replace(employee ? "/meu-trabalho" : "/agenda");
  }, [loading, user, pathname, employee, reception, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span role="status" className="flex items-center gap-3 text-sm text-gray-600">
          <span className="size-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" aria-hidden="true" />
          <span className="sr-only">Carregando…</span>
        </span>
      </div>
    );
  }

  return (
    <AssistantProvider><SidebarProvider className={lightTheme ? styles.lightShell : undefined} style={{ "--sidebar-width": "15rem" } as React.CSSProperties}>
      <WorkspaceNavigation user={user} workspace={workspace} />
      <SidebarInset id="main-content" tabIndex={-1} className="min-h-screen min-w-0 bg-[#f5f8fc] text-[#102238]">
        <div className={`print-hidden sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#dbe6f0] bg-white/90 px-3 backdrop-blur sm:px-5 ${lightTheme ? styles.lightTopbar : ""}`}>
          <SidebarTrigger
            aria-label="Abrir ou recolher menu"
            title="Abrir ou recolher menu"
            className="size-10 rounded-md border border-[#dce5f0]"
          />
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <VemoMark className="size-8" decorative />
            <span className="truncate font-semibold" title={workspace?.name}>{workspace?.name ?? "Vemo"}</span>
          </div>
          <nav aria-label="Localização atual" className="hidden min-w-0 md:block">
            <ol className="flex items-center gap-2 text-sm">
              <li className="max-w-72 truncate text-[#718198]" title={workspace?.name}>{workspace?.name ?? "Vemo"}</li>
              <li aria-hidden="true"><ChevronRight className="size-4 text-[#94a3b8]" /></li>
          <li aria-current="page" className="truncate font-semibold text-[#263a58]">{currentPage?.label ?? (pathname === "/noticias" ? "Notícias" : "Seu negócio")}</li>
            </ol>
          </nav>
          {!blocked && !employee && !reception && workspace?.role !== "viewer" && <WorkspaceAssistant />}
        </div>
        {workspace && !blocked && <div className={saasStyles.banner}>
          <span>{employee ? "Funcionário · acesso ao próprio trabalho" : reception ? "Recepção · sem acesso financeiro" : workspace.role === "viewer" ? "Leitura geral da empresa" : workspace.entitlement.state === "trial" ? `Teste gratuito · até ${new Date(workspace.entitlement.endsAt!).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : workspace.entitlement.state === "paid" ? "Assinatura ativa" : "Acesso mantido"}</span>
          <Link href={employee || reception ? "/configuracoes" : "/configuracoes#assinatura"}>{employee || reception ? "Minha conta" : workspace.kind === "individual" ? "Conta e assinatura" : "Empresa e assinatura"}</Link>
        </div>}
        {blocked && pathname !== "/configuracoes" ? <section className={saasStyles.gate}>
          <h1>{workspaceError ? "Empresa indisponível" : "Seu período de acesso terminou"}</h1>
          <p>{workspaceError || (employee ? "O acesso da empresa está suspenso. Entre em contato com o responsável." : "Seus clientes, orçamentos e lançamentos continuam preservados. Uma assinatura ativa é necessária para continuar usando esta empresa.")}</p>
          <Link href={employee ? "/configuracoes" : "/configuracoes#assinatura"}>{workspaceError ? "Escolher outra empresa" : employee ? "Minha conta" : "Ver assinatura"}<ChevronRight className="size-4" aria-hidden="true" /></Link>
        </section> : forbiddenPage ? <section className={saasStyles.gate}><h1>Acesso restrito</h1><p>Esta área não está disponível para o seu perfil nesta conta.</p><Link href={employee ? "/meu-trabalho" : reception ? "/agenda" : "/hoje"}>{employee ? "Ir para meu trabalho" : reception ? "Ir para agenda" : "Ir para início"}<ChevronRight aria-hidden="true" className="size-4" /></Link></section> : children}
      </SidebarInset>
    </SidebarProvider></AssistantProvider>
  );
}
