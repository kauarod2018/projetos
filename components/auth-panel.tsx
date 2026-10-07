"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccessShell } from "@/components/access-shell";
import { MONTHLY_PRICE_LABEL } from "@/lib/billing-policy";

type AuthPanelProps = { mode: "login" | "register"; freeMonth?: boolean; legal?: { terms: string | null; privacy: string | null } };

export function AuthPanel({ mode, freeMonth = false, legal }: AuthPanelProps) {
  const isRegister = mode === "register";
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [accountKind, setAccountKind] = useState<"individual" | "company">("individual");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNeedsVerification(false);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    if (isRegister && !acceptedTerms) {
      setError("Confirme que você aceita os termos para continuar.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), phone: form.get("phone"), email: form.get("email"), password, ...(isRegister && freeMonth ? { accountKind, companyName: form.get("companyName") ?? "" } : {}) }),
      });
      const data = (await response.json()) as { error?: string; code?: string; requiresVerification?: boolean };
      if (data.code === "EMAIL_NOT_VERIFIED") setNeedsVerification(true);
      if (!response.ok) throw new Error(data.error ?? "Não foi possível continuar.");
      // Reset in-memory views when the authenticated identity changes.
      window.location.replace(data.requiresVerification ? "/verificar-email" : "/hoje");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível continuar.");
      setLoading(false);
    }
  }

  return (
    <AccessShell>
        <section className="w-full rounded-lg border border-[#ebe9e4] bg-white p-5 shadow-[0_14px_42px_rgba(19,51,94,0.08)] sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase text-[#2f62f5]">{isRegister ? "COMECE AGORA" : "BEM-VINDO DE VOLTA"}</p>
            <h1 className="mt-2 text-[1.7rem] font-semibold leading-tight">{isRegister ? "Crie sua conta" : "Entre na sua conta"}</h1>
            <p className="mt-2 text-sm leading-6 text-[#6f6d68]">{isRegister ? freeMonth ? "Individual ou empresa, com o mesmo mês de teste." : "Organize a rotina do seu negócio." : "Acesse seu espaço de trabalho Vemo."}</p>
            {isRegister && freeMonth && <p className="mt-3 text-sm leading-6 text-[#0f8a63]">Um mês grátis para seu novo negócio, sem cartão. Depois, {MONTHLY_PRICE_LABEL}/mês para continuar, mediante contratação. Sem cobrança automática durante o teste.</p>}
          </div>

          <form onSubmit={submit} className="mt-7 space-y-5">
            {isRegister && freeMonth && <><fieldset><legend className="mb-2 text-sm font-medium">Tipo de conta</legend><div className="grid grid-cols-2 gap-3">{(["individual", "company"] as const).map(kind => <label key={kind} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-[#d6d4ce] p-3 text-sm"><input type="radio" name="accountKind" value={kind} checked={accountKind === kind} onChange={() => setAccountKind(kind)} className="size-4 accent-[#2f62f5]" />{kind === "individual" ? "Individual" : "Empresa"}</label>)}</div></fieldset>{accountKind === "company" && <Field label="Nome da empresa" name="companyName" required minLength={2} maxLength={120} autoComplete="organization" placeholder="Sua empresa" icon={UserRound} />}</>}
            {isRegister && <div className="grid gap-5 sm:grid-cols-2"><Field label="Nome completo" name="name" placeholder="Seu nome" icon={UserRound} required autoComplete="name" /><Field label="Celular" name="phone" placeholder="(00) 00000-0000" icon={Phone} autoComplete="tel" /></div>}
            <Field label="E-mail" name="email" type="email" placeholder="voce@exemplo.com" icon={Mail} required autoComplete="email" autoCapitalize="none" spellCheck={false} />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="password">Senha</Label>{!isRegister && <Link href="/esqueci-senha" className="text-sm font-medium text-[#2f62f5] underline-offset-4 hover:underline">Esqueci minha senha</Link>}</div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder={isRegister ? "Mínimo de 12 caracteres" : "Digite sua senha"} required minLength={isRegister ? 12 : 8} maxLength={128} autoComplete={isRegister ? "new-password" : "current-password"} className="h-12 rounded-lg border-[#ebe9e4] bg-[#f6f5f2] pl-10 pr-11 focus-visible:border-[#2f62f5] focus-visible:ring-[#2f62f5]/20" />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-[#2f62f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f62f5]" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button>
              </div>
            </div>

            {isRegister && <div className="space-y-2"><div className="flex items-start gap-3"><Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked === true)} className="mt-0.5 border-gray-300 data-[state=checked]:border-[#2f62f5] data-[state=checked]:bg-[#2f62f5]" /><Label htmlFor="terms" className="block cursor-pointer text-sm font-normal leading-5 text-[#6f6d68]">Aceito os termos de uso e a política de privacidade da Vemo.</Label></div>{legal?.terms && legal.privacy ? <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm"><a href={legal.terms} target="_blank" rel="noopener noreferrer" className="text-[#2f62f5] underline">Termos de uso</a><a href={legal.privacy} target="_blank" rel="noopener noreferrer" className="text-[#2f62f5] underline">Política de privacidade</a></p> : <p className="text-sm leading-5 text-[#6f6d68]">Os documentos de contratação ainda estão em preparação. Cadastros públicos serão liberados após sua publicação.</p>}</div>}
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
            {needsVerification && <Link href="/verificar-email" className="block text-sm font-medium text-[#2f62f5] underline-offset-4 hover:underline">Enviar novo link de confirmação</Link>}

            <Button type="submit" disabled={loading} aria-live="polite" className="h-12 w-full rounded-lg bg-[#174fce] text-base text-white shadow-sm hover:bg-[#103fae]">{loading ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Aguarde…</> : <>{isRegister ? "Criar minha conta" : "Entrar"}<ArrowRight className="size-4" aria-hidden="true" /></>}</Button>
          </form>

          <p className="mt-7 text-center text-sm text-[#6f6d68]">{isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"} <Link href={isRegister ? "/entrar" : "/cadastro"} className="font-semibold text-[#2f62f5] underline-offset-4 hover:underline">{isRegister ? "Entrar" : "Criar conta grátis"}</Link></p>
        </section>
    </AccessShell>
  );
}

function Field({ label, icon: Icon, ...props }: { label: string; icon: typeof Mail } & React.ComponentProps<typeof Input>) {
  const id = String(props.name);
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className="relative"><Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-500" aria-hidden="true" /><Input id={id} {...props} className="h-12 rounded-lg border-[#ebe9e4] bg-[#f6f5f2] pl-10 focus-visible:border-[#2f62f5] focus-visible:ring-[#2f62f5]/20" /></div></div>;
}
