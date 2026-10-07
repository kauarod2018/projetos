"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, Check, LogIn } from "lucide-react";
import { AccessShell } from "@/components/access-shell";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function InvitePage() {
  const { user, loading } = useCurrentUser();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setToken(window.location.hash.slice(1)); }, []);

  async function accept() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/workspaces/invites/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível aceitar o convite.");
      window.location.replace(data.next === "/meu-trabalho" ? "/meu-trabalho" : "/hoje");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível aceitar o convite."); setBusy(false); }
  }

  return <AccessShell><section className="w-full rounded-lg border border-[#ebe9e4] bg-white p-5 sm:p-8">
    <Users className="size-7 text-[#2f62f5]" aria-hidden="true" />
    <h1 className="mt-4 text-2xl font-semibold">Convite para uma empresa</h1>
    {loading ? <p role="status" className="mt-4 text-sm">Carregando sua conta…</p> : !/^[A-Za-z0-9_-]{32}$/.test(token) ? <p role="alert" className="mt-4 text-sm text-[#c8322f]">Este link está incompleto. Peça um novo convite.</p> : !user ? <>
      <p className="mt-4 text-sm leading-6 text-[#6f6d68]">Entre com o e-mail convidado. Depois, abra este mesmo link para confirmar o acesso.</p>
      <div className="mt-5 flex flex-wrap gap-3"><Button asChild className="min-h-11"><Link href="/entrar"><LogIn aria-hidden="true" />Entrar</Link></Button><Button asChild variant="outline" className="min-h-11"><Link href="/cadastro">Criar conta</Link></Button></div>
    </> : <>
      <p className="mt-4 break-all text-sm leading-6 text-[#6f6d68]">Conta: {user.email}</p>
      <p className="mt-3 text-sm leading-6 text-[#6f6d68]">Ao aceitar, você entra na empresa com a permissão do convite. O teste gratuito da empresa não é reiniciado.</p>
      {user.emailVerifiedAt ? <Button onClick={() => void accept()} disabled={busy} className="mt-5 min-h-11"><Check aria-hidden="true" />{busy ? "Confirmando…" : "Aceitar convite"}</Button> : <Button asChild variant="outline" className="mt-5 min-h-11"><Link href="/verificar-email">Confirmar meu e-mail</Link></Button>}
      <p className="mt-4 text-sm"><Link href="/configuracoes" className="text-[#124faf] underline underline-offset-4">Voltar para minha conta</Link></p>
    </>}
    {error && <p role="alert" className="mt-4 text-sm leading-6 text-[#c8322f]">{error}</p>}
  </section></AccessShell>;
}
