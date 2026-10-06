"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, FileX2, Plus, RefreshCw } from "lucide-react";

import { QuoteCard } from "@/components/quote-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceShell } from "@/components/workspace-shell";
import type { Quote } from "@/lib/models";
import { useCurrentUser } from "@/hooks/use-current-user";
import { summarizeQuotes } from "@/lib/today-summary";
import { Label } from "@/components/ui/label";
import styles from "@/components/quote-workspace.module.css";

export default function QuotesPage() {
  return <WorkspaceShell><QuotesContent /></WorkspaceShell>;
}

function QuotesContent() {
  const { workspace } = useCurrentUser();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("todos");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/quotes", { cache: "no-store" });
      const data = (await response.json()) as { quotes?: Quote[]; error?: string };
      if (!response.ok) throw new Error(data.error);
      setQuotes(data.quotes ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os orçamentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const requested = new URLSearchParams(window.location.search).get("filtro");
    if (requested && ["rascunhos", "expirados", "retornos", "arquivados"].includes(requested)) setFilter(requested);
  }, [loadData]);

  const visibleQuotes = useMemo(() => {
    const active = quotes.filter(quote => !quote.archivedAt);
    if (filter === "arquivados") return quotes.filter(quote => quote.archivedAt);
    const summary = summarizeQuotes(active, new Date());
    if (filter === "rascunhos") return summary.drafts;
    if (filter === "expirados") return summary.expired;
    if (filter === "retornos") return summary.followUps.map((item) => item.quote);
    return active;
  }, [quotes, filter]);

  const reminders = useMemo(() => {
    const now = Date.now();
    return quotes.filter((quote) => {
      if (quote.archivedAt || quote.status !== "Enviado" || !quote.sentAt) return false;
      return now - new Date(quote.sentAt).getTime() >= 3 * 24 * 60 * 60 * 1000;
    });
  }, [quotes]);

  return (
    <>
      <div>
        <section className={`mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 ${styles.quotesPage}`}>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold">Orçamentos</h1>
            <Button asChild className="h-12 rounded-xl bg-blue-600 px-5 text-base text-white hover:bg-blue-700">
              <Link href="/novo-orcamento"><Plus className="size-4" /> Novo Orçamento</Link>
            </Button>
          </header>

          {reminders.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <BellRing className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-amber-950">
                    {reminders.length === 1 ? "1 cliente espera um retorno" : `${reminders.length} clientes esperam um retorno`}
                  </p>
                  <p className="mt-1 text-sm text-amber-800">Orçamentos enviados há mais de 3 dias.</p>
                </div>
              </div>
              <Button asChild variant="outline" className="rounded-xl border-amber-300 bg-white text-amber-900">
                <Link href={`/orcamentos/${reminders[0].id}`}>Ver lembrete</Link>
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Seus orçamentos</h2>
              <p className="mt-1 text-sm text-gray-500">Acompanhe cada etapa até o pagamento.</p>
            </div>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="quote-filter">Mostrar</Label>
              <select id="quote-filter" value={filter} onChange={(event) => {
                const value = event.target.value;
                setFilter(value);
                const url = new URL(window.location.href);
                if (value === "todos") url.searchParams.delete("filtro"); else url.searchParams.set("filtro", value);
                window.history.replaceState(null, "", url);
              }} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base focus-visible:outline-blue-600">
                <option value="todos">Ativos</option><option value="rascunhos">Rascunhos</option><option value="retornos">Aguardando retorno há 3 dias</option><option value="expirados">Validade encerrada</option><option value="arquivados">Arquivados</option>
              </select>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-64 rounded-2xl" />)}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
                <p className="text-sm text-red-700">{error}</p>
                <Button onClick={() => void loadData()} variant="outline" className="mt-4 rounded-xl">
                  <RefreshCw className="size-4" /> Tentar novamente
                </Button>
              </div>
            ) : visibleQuotes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleQuotes.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} readonly={workspace?.role === "viewer"} onDelete={() => setQuotes(current => current.filter(item => item.id !== quote.id))} onChanged={changed => setQuotes(current => current.map(item => item.id === changed.id ? changed : item))} />
                ))}
              </div>
            ) : filter !== "todos" ? (
              <div className="border-t border-gray-200 py-10 text-center"><p>Nenhum orçamento neste filtro.</p><Button variant="outline" className="mt-4 h-11" onClick={() => { setFilter("todos"); window.history.replaceState(null, "", "/orcamentos"); }}>Ver todos</Button></div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                  <FileX2 className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">Seu primeiro orçamento começa aqui</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">Crie um orçamento profissional e acompanhe até receber.</p>
                <Button asChild className="mt-5 rounded-xl">
                  <Link href="/novo-orcamento"><Plus className="size-4" /> Novo orçamento</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
