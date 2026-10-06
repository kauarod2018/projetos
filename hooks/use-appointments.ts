"use client";
import { useEffect, useState } from "react";
import type { Appointment } from "@/lib/appointments";

export function useAppointments(from: string, to: string, revision: number) {
  const [state, setState] = useState<{ key: string; loading: boolean; error: string; items: Appointment[] }>({ key: "", loading: true, error: "", items: [] });
  const key = `${from}/${to}/${revision}`;
  useEffect(() => {
    if (!from || !to) return;
    const controller = new AbortController();
    setState({ key, loading: true, error: "", items: [] });
    void fetch(`/api/appointments?from=${from}&to=${to}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.appointments)) throw new Error();
      if (!controller.signal.aborted) setState({ key, loading: false, error: "", items: data.appointments });
    }).catch(() => { if (!controller.signal.aborted) setState({ key, loading: false, error: "Não foi possível carregar a agenda. Tente novamente.", items: [] }); });
    return () => controller.abort();
  }, [from, to, key]);
  return state.key === key ? state : { loading: true, error: "", items: [] };
}
