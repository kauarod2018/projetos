export const workspaceNavigation = [
  { label: "Hoje", href: "/hoje", icon: "home" },
  { label: "Clientes", href: "/clientes", icon: "clients" },
  { label: "Agenda", href: "/agenda", icon: "calendar" },
  { label: "Financeiro", href: "/financas", icon: "finance" },
  { label: "Orçamentos", href: "/orcamentos", icon: "quotes" },
  { label: "Serviços", href: "/servicos", icon: "services" },
  { label: "Configurações", href: "/configuracoes", icon: "settings" },
] as const;

export const employeeNavigation = [
  { label: "Meu trabalho", href: "/meu-trabalho", icon: "calendar" },
  { label: "Minha conta", href: "/configuracoes", icon: "settings" },
] as const;
export const receptionNavigation = [
  { label: "Agenda", href: "/agenda", icon: "calendar" },
  { label: "Clientes", href: "/clientes", icon: "clients" },
  { label: "Minha conta", href: "/configuracoes", icon: "settings" },
] as const;

export function isWorkspaceRouteActive(pathname: string, href: string) {
  if (href === "/hoje" && pathname === "/home") return true;
  if (href === "/orcamentos" && ["/dashboard", "/novo-orcamento"].includes(pathname)) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
