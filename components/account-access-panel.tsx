"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccessShell } from "@/components/access-shell";

type Mode = "forgot" | "reset" | "request-verification" | "verify";
const content = {
  forgot: { title: "Esqueceu sua senha?", description: "Informe o e-mail da sua conta para solicitar um link de recuperação.", action: "Enviar link de recuperação", endpoint: "forgot-password" },
  reset: { title: "Crie uma nova senha", description: "Use pelo menos 12 caracteres e uma senha que você não usa em outros serviços.", action: "Salvar nova senha", endpoint: "reset-password" },
  "request-verification": { title: "Confirme seu e-mail", description: "Informe o e-mail da sua conta para solicitar uma nova mensagem de confirmação.", action: "Enviar link de confirmação", endpoint: "verification-email" },
  verify: { title: "Confirme seu e-mail", description: "Confirme este endereço de e-mail para sua conta Vemo.", action: "Confirmar e-mail", endpoint: "verify-email" },
};

export function AccountAccessPanel({ mode }: { mode: Mode }) {
  const details = content[mode];
  const needsToken = mode === "reset" || mode === "verify";
  const captured = useRef(false);
  const [ready, setReady] = useState(!needsToken);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!needsToken || captured.current) return;
    captured.current = true;
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    // Keep the bearer token out of subsequent history entries and server requests.
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    if (/^[A-Za-z0-9_-]{43}$/.test(value)) setToken(value);
    else setError("Link inválido ou incompleto. Abra o link do e-mail ou solicite um novo.");
    setReady(true);
  }, [needsToken]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || (needsToken && !token)) return;
    setError("");
    if (mode === "reset" && password !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${details.endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(needsToken ? { token, ...(mode === "reset" ? { password, confirmPassword } : {}) } : { email }),
      });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível continuar. Tente novamente.");
      setMessage(data.message || "Solicitação concluída.");
      setToken(""); setPassword(""); setConfirmPassword("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível continuar.");
    } finally { setLoading(false); }
  }

  const retryPath = mode === "reset" ? "/esqueci-senha" : "/verificar-email";
  return (
    <AccessShell>
      <section className="w-full rounded-lg border border-[#ebe9e4] bg-white p-5 shadow-[0_14px_42px_rgba(19,51,94,0.08)] sm:p-8">
        <p className="text-xs font-semibold uppercase text-[#2f62f5]">Conta Vemo</p>
        <h1 className="mt-2 text-[1.7rem] font-semibold leading-tight">{message ? (needsToken ? "Tudo certo" : "Confira seu e-mail") : details.title}</h1>
        {message ? (
          <div role="status" className="mt-5 space-y-5">
            {needsToken ? <CheckCircle2 aria-hidden="true" className="size-8 text-emerald-700" /> : <Mail aria-hidden="true" className="size-8 text-[#2f62f5]" />}
            <p className="text-sm leading-6 text-[#6f6d68]">{message}</p>
            <Button asChild className="min-h-12 w-full rounded-lg bg-[#174fce] text-white hover:bg-[#103fae]"><Link href="/entrar">Voltar para entrar</Link></Button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-[#6f6d68]">{details.description}</p>
            <form onSubmit={submit} className="mt-6 space-y-5">
              {!needsToken && <div className="space-y-2"><Label htmlFor="account-email">E-mail</Label><Input id="account-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" className="h-12 rounded-lg border-[#ebe9e4] bg-[#f6f5f2] focus-visible:border-[#2f62f5] focus-visible:ring-[#2f62f5]/20" /></div>}
              {mode === "reset" && token && <>
                <div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><div className="relative"><Input id="new-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-lg border-[#ebe9e4] bg-[#f6f5f2] pr-12 focus-visible:border-[#2f62f5] focus-visible:ring-[#2f62f5]/20" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-md text-gray-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f62f5]">{showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button></div></div>
                <div className="space-y-2"><Label htmlFor="confirm-password">Confirme a nova senha</Label><Input id="confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 rounded-lg border-[#ebe9e4] bg-[#f6f5f2] focus-visible:border-[#2f62f5] focus-visible:ring-[#2f62f5]/20" /></div>
              </>}
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p>}
              <Button disabled={!ready || loading || (needsToken && !token)} aria-live="polite" className="min-h-12 w-full whitespace-normal rounded-lg bg-[#174fce] px-3 text-white hover:bg-[#103fae]" type="submit">{loading ? <><LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" /> Aguarde…</> : details.action}</Button>
              {needsToken && <Link href={retryPath} className="block text-center text-sm font-medium text-[#2f62f5] underline-offset-4 hover:underline">Solicitar um novo link</Link>}
            </form>
            <Link href="/entrar" className="mt-7 inline-flex items-center gap-2 text-sm text-[#6f6d68] hover:text-[#2f62f5]"><ArrowLeft className="size-4" aria-hidden="true" /> Voltar para entrar</Link>
          </>
        )}
      </section>
    </AccessShell>
  );
}
