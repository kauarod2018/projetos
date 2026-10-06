export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer" | "employee" | "reception";
export type WorkspaceKind = "individual" | "company";
export type Subscription = { status: string; trialStartsAt: string | null; trialEndsAt: string | null; paidUntil: string | null };
export type Entitlement = { allowed: boolean; state: "trial" | "paid" | "legacy" | "expired"; endsAt: string | null; daysLeft: number };
export type WorkspaceSummary = { id: number; name: string; role: WorkspaceRole; kind?: WorkspaceKind; entitlement: Entitlement };

export function oneMonthAfter(start: Date) {
  if (!Number.isFinite(start.getTime())) throw new Error("INVALID_TRIAL_DATE");
  const end = new Date(start);
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return end.toISOString();
}

export function entitlement(subscription: Subscription | undefined, now = Date.now()): Entitlement {
  const finiteFuture = (date: string | null) => date !== null && Number.isFinite(Date.parse(date)) && Date.parse(date) > now;
  if (subscription?.status === "legacy") return { allowed: true, state: "legacy", endsAt: null, daysLeft: 0 };
  if (subscription?.status === "trialing" && finiteFuture(subscription.trialEndsAt) && subscription.trialStartsAt && Date.parse(subscription.trialStartsAt) <= now) {
    return { allowed: true, state: "trial", endsAt: subscription.trialEndsAt, daysLeft: Math.ceil((Date.parse(subscription.trialEndsAt!) - now) / 86_400_000) };
  }
  if (subscription && ["active", "canceled"].includes(subscription.status) && finiteFuture(subscription.paidUntil)) {
    return { allowed: true, state: "paid", endsAt: subscription.paidUntil, daysLeft: 0 };
  }
  return { allowed: false, state: "expired", endsAt: subscription?.trialEndsAt ?? null, daysLeft: 0 };
}

export function validRole(value: string): value is WorkspaceRole {
  return ["owner", "admin", "editor", "viewer", "employee", "reception"].includes(value);
}

export function canManageTeam(role: WorkspaceRole) { return role === "owner" || role === "admin"; }
export function canSchedule(role: WorkspaceRole) { return canManageTeam(role) || role === "editor" || role === "reception"; }
export function canManageRole(actor: WorkspaceRole, target: WorkspaceRole, next?: WorkspaceRole) {
  if (target === "owner" || next === "owner") return false;
  return actor === "owner" || (actor === "admin" && target !== "admin" && next !== "admin");
}

export function assertBusinessAccess(role: WorkspaceRole, access: Entitlement, method: string, path: string) {
  if (!access.allowed) throw new Error("SAAS_SUBSCRIPTION_REQUIRED");
  // Employees use a separate, minimal projection. No generic business API is allowed.
  if (role === "employee") throw new Error("SAAS_FORBIDDEN");
  if (role === "reception" && !/^\/api\/(customers(?:\/\d+)?|appointments(?:\/\d+)?|services)$/.test(path)) throw new Error("SAAS_FORBIDDEN");
  if (role === "reception" && path === "/api/services" && !["GET", "HEAD"].includes(method)) throw new Error("SAAS_FORBIDDEN");
  if (["GET", "HEAD"].includes(method)) return;
  if (path === "/api/business-profile" && !canManageTeam(role)) throw new Error("SAAS_FORBIDDEN");
  if (role === "viewer") throw new Error("SAAS_READ_ONLY");
}
