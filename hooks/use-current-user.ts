"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth";
import type { WorkspaceSummary } from "@/lib/saas-policy";

export type CurrentUser = AuthUser;

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [workspaceError, setWorkspaceError] = useState("");

  useEffect(() => {
    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { user?: CurrentUser | null; workspace?: WorkspaceSummary; workspaceError?: string };
        setUser(response.ok ? data.user ?? null : null);
        setWorkspace(response.ok ? data.workspace ?? null : null);
        setWorkspaceError(data.workspaceError ?? "");
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const refresh = () => setWorkspace(current => current?.entitlement.endsAt && current.entitlement.allowed && Date.parse(current.entitlement.endsAt) <= Date.now()
      ? { ...current, entitlement: { ...current.entitlement, allowed: false, state: "expired", daysLeft: 0 } } : current);
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  return { user, loading, workspace, workspaceError };
}
