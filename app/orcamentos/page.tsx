"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, BellRing, FileX2, Plus, RefreshCw, Search, Send, TrendingUp, Wallet } from "lucide-react";

import { QuoteCard } from "@/components/quote-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceShell } from "@/components/workspace-shell";
import { formatMoney, type Quote } from "@/lib/models";
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");

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

  const stats = useMemo(() => {
    const active = quotes.filter(quote => !quote.archivedAt);
    const sum = (list: Quote[]) => list.reduce((total, quote) => total + quote.totalCents, 0);
    const waiting = active.filter(quote => quote.status === "Enviado");
    const approved = active.filter(quote => ["Aprovado", "Em andamento", "Finalizado"].includes(quote.status));
    const paid = quotes.filter(quote => quote.status === "Pago");
    const decided = quotes.filter(quote => ["Aprovado", "Em andamento", "Finalizado", "Pago", "Recusado"].includes(quote.status));
    const won = decided.filter(quote => quote.status !== "Recusado");
    return { waiting: { count: waiting.length, total: sum(waiting) }, approved: { count: approved.length, total: sum(approved) }, paid: { count: paid.length, total: sum(paid) }, rate: decided.length ? Math.round((won.length / decided.length) * 100) : null, decided: decided.length };
  }, [quotes]);

  const searched = useMemo(() => {
    const query = search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/^#/, "");
    if (!query) return visibleQuotes;
    return visibleQuotes.filter(quote => [quote.client.name, String(quote.id), quote.description, quote.status].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(query));
  }, [visibleQuotes, search]);

  function chooseFilter(value: string) {
    setFilter(value);
    const url = new URL(window.location.href);
    if (value === "todos") url.searchParams.delete("filtro"); else url.searchParams.set("filtro", value);
    window.history.replaceState(null, "", url);
  }

  return (
    <section className={styles.quotesPage}>
      <header className={styles.header}>
        <div><h1>Orçamentos</h1><p>Do envio até o pagamento, acompanhe cada proposta.</p></div>
        <Button asChild className={styles.newButton}><Link href="/novo-orcamento"><Plus className="size-4" />Novo orçamento</Link></Button>
      </header>

      {!loading && !error && <dl className={styles.stats}>
        <div data-tone="blue"><dt><Send aria-hidden="true" />Aguardando resposta</dt><dd>{formatMoney(stats.waiting.total)}</dd><small>{stats.waiting.count} {stats.waiting.count === 1 ? "orçamento" : "orçamentos"}</small></div>
        <div data-tone="violet"><dt><BadgeCheck aria-hidden="true" />Aprovados para receber</dt><dd>{formatMoney(stats.approved.total)}</dd><small>{stats.approved.count} {stats.approved.count === 1 ? "orçamento" : "orçamentos"}</small></div>
        <div data-tone="green"><dt><Wallet aria-hidden="true" />Já recebidos</dt><dd>{formatMoney(stats.paid.total)}</dd><small>{stats.paid.count} {stats.paid.count === 1 ? "orçamento pago" : "orçamentos pagos"}</small></div>
        <div data-tone="amber"><dt><TrendingUp aria-hidden="true" />Taxa de aprovação</dt><dd>{stats.rate === null ? "—" : `${stats.rate}%`}</dd><small>{stats.decided ? `de ${stats.decided} com resposta` : "Ainda sem respostas"}</small></div>
      </dl>}

      {reminders.length > 0 && filter !== "retornos" && (
        <div className={styles.reminder}>
          <BellRing aria-hidden="true" />
          <div><strong>{reminders.length === 1 ? "1 cliente ainda não respondeu" : `${reminders.length} clientes ainda não responderam`}</strong><p>Orçamentos enviados há mais de 3 dias. Um lembrete pelo WhatsApp costuma ajudar.</p></div>
          <button type="button" onClick={() => chooseFilter("retornos")}>Ver quais</button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.pills} role="group" aria-label="Filtrar orçamentos">
          {[["todos", "Ativos"], ["rascunhos", "Rascunhos"], ["retornos", "Sem resposta"], ["expirados", "Vencidos"], ["arquivados", "Arquivados"]].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => chooseFilter(value)}>{label}</button>)}
        </div>
        <div className={styles.search}>
          <Search aria-hidden="true" />
          <Label htmlFor="quote-search" className="sr-only">Buscar orçamento</Label>
          <Input id="quote-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar cliente ou número" />
        </div>
      </div>

      {loading ? (
        <div className={styles.grid}>{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-56 rounded-2xl" />)}</div>
      ) : error ? (
        <div className={styles.errorBox}><p>{error}</p><Button onClick={() => void loadData()} variant="outline" className="mt-4 rounded-full"><RefreshCw className="size-4" /> Tentar novamente</Button></div>
      ) : searched.length > 0 ? (
        <div className={styles.grid}>
          {searched.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} readonly={workspace?.role === "viewer"} onDelete={() => setQuotes(current => current.filter(item => item.id !== quote.id))} onChanged={changed => setQuotes(current => current.map(item => item.id === changed.id ? changed : item))} />
          ))}
        </div>
      ) : filter !== "todos" || search ? (
        <div className={styles.empty}><FileX2 aria-hidden="true" /><h3>Nenhum orçamento encontrado</h3><Button variant="outline" className="mt-2 h-11 rounded-full" onClick={() => { setSearch(""); chooseFilter("todos"); }}>Ver todos</Button></div>
      ) : (
        <div className={styles.empty}>
          <FileX2 aria-hidden="true" />
          <h3>Seu primeiro orçamento começa aqui</h3>
          <p>Crie um orçamento profissional, envie pelo WhatsApp e acompanhe até receber.</p>
          <Button asChild className={`${styles.newButton} mt-3`}><Link href="/novo-orcamento"><Plus className="size-4" /> Novo orçamento</Link></Button>
        </div>
      )}
    </section>
  );
}
