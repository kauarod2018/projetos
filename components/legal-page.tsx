import Link from "next/link";
import { VemoWordmark } from "@/components/vemo-brand";

/* Estrutura comum das páginas legais públicas. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--background)] text-[var(--vemo-text)]">
    <header className="border-b border-[var(--vemo-line)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
        <Link href="/" aria-label="Vemo, página inicial"><VemoWordmark className="h-9 w-28" /></Link>
        <Link href="/entrar" className="text-sm font-semibold text-[var(--vemo-brand)]">Entrar</Link>
      </div>
    </header>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-[var(--vemo-muted)]">Última atualização: {updated}</p>
      <div className="mt-8 space-y-6 text-[15.5px] leading-7 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-[#3b3a36] [&_ul]:space-y-1">{children}</div>
      <p className="mt-12 border-t border-[var(--vemo-line)] pt-6 text-sm text-[var(--vemo-muted)]"><Link href="/termos" className="underline underline-offset-4">Termos de uso</Link> · <Link href="/privacidade" className="underline underline-offset-4">Política de privacidade</Link> · <Link href="/" className="underline underline-offset-4">Voltar ao início</Link></p>
    </main>
  </div>;
}
