"use client";

import Link from "next/link";
import { whatsappLink } from "@/lib/whatsapp";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FilePlus, Mail, MapPin, MessageCircle, Pencil, Plus, Search, UserRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceShell } from "@/components/workspace-shell";
import { formatMoney, type Customer, type Quote } from "@/lib/models";
import styles from "@/components/customer-workspace.module.css";
import { useCurrentUser } from "@/hooks/use-current-user";

const emptyForm = { name: "", phone: "", email: "", address: "", notes: "" };

export default function CustomersPage() {
  return <WorkspaceShell><CustomersContent /></WorkspaceShell>;
}

function CustomersContent() {
  const { workspace, loading: sessionLoading } = useCurrentUser();
  const reception = workspace?.role === "reception";
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    if (sessionLoading) return;
    setLoading(true);
    setError("");
    try {
      const [customersResponse, quotesResponse] = await Promise.all([
        fetch("/api/customers", { cache: "no-store" }),
        reception ? Promise.resolve(new Response(JSON.stringify({ quotes: [] }), { status: 200 })) : fetch("/api/quotes", { cache: "no-store" }),
      ]);
      const customersData = (await customersResponse.json()) as { customers?: Customer[]; error?: string };
      const quotesData = (await quotesResponse.json()) as { quotes?: Quote[]; error?: string };
      if (!customersResponse.ok) throw new Error(customersData.error);
      if (!quotesResponse.ok) throw new Error(quotesData.error);
      setCustomers(customersData.customers ?? []);
      setQuotes(quotesData.quotes ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }, [reception, sessionLoading]);

  useEffect(() => {
    void loadData();
    if (new URLSearchParams(window.location.search).get("novo") === "1") setOpen(true);
  }, [loadData]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(query),
      ),
    );
  }, [customers, search]);

  const quoteSummaryByCustomer = useMemo(() => {
    const summary = new Map<number, { count: number; approvedTotal: number; latestQuoteId?: number }>();
    for (const quote of quotes) {
      const current = summary.get(quote.customerId) ?? { count: 0, approvedTotal: 0 };
      current.count += 1;
      current.latestQuoteId ??= quote.id;
      if (["Aprovado", "Em andamento", "Finalizado", "Pago"].includes(quote.status)) {
        current.approvedTotal += quote.totalCents;
      }
      summary.set(quote.customerId, current);
    }
    return summary;
  }, [quotes]);

  function openNewCustomer() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setOpen(true);
  }

  async function submitCustomer(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(editingId ? `/api/customers/${editingId}` : "/api/customers", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { customer?: Customer; error?: string };
      if (!response.ok || !data.customer) throw new Error(data.error);
      setCustomers((current) => [...current.filter((item) => item.id !== data.customer!.id), data.customer!].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(emptyForm);
      setOpen(false);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className={`${styles.page} mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8`}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[26px] font-bold sm:text-[30px]">Clientes</h1>
            <p className="mt-1 text-base text-gray-500">{reception ? "Contatos para organizar seus atendimentos." : "Contatos e histórico reunidos em um só lugar."}</p>
          </div>
          <Button onClick={openNewCustomer} className={`${styles.primaryAction} h-11 rounded-full px-5`}>
            <Plus className="size-4" /> Novo cliente
          </Button>
        </header>

        <div className={`${styles.search} relative max-w-md`}>
          <Label htmlFor="customer-search" className="sr-only">Buscar clientes</Label>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <Input
            id="customer-search"
            name="customerSearch"
            type="search"
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail"
            className={`${styles.searchInput} h-11 rounded-lg border-gray-200 bg-white pl-10`}
          />
        </div>

        {error && <p role="alert" className={`${styles.error} rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700`}>{error}</p>}

        {loading ? (
          <div className={`${styles.results} grid gap-4 md:grid-cols-2`}>
            {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-56 rounded-2xl" />)}
          </div>
        ) : filteredCustomers.length ? (
          <div className={`${styles.results} grid gap-4 md:grid-cols-2`}>
            {filteredCustomers.map((customer) => {
              const quoteSummary = quoteSummaryByCustomer.get(customer.id) ?? { count: 0, approvedTotal: 0 };

              return (
                <article key={customer.id} className={`${styles.clientCard} border p-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`${styles.avatar} flex size-11 shrink-0 items-center justify-center rounded-full font-semibold`} data-tone={customer.id % 6}>
                        {customer.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-semibold">{customer.name}</h2>
                        {!reception && <p className="text-sm text-gray-500">{quoteSummary.count} orçamento{quoteSummary.count === 1 ? "" : "s"}</p>}
                      </div>
                    </div>
                    {customer.phone && (
                      <Button asChild variant="outline" size="icon" className="size-10 rounded-xl">
                        <a href={whatsappLink(customer.phone)} target="_blank" rel="noreferrer" aria-label={`Conversar com ${customer.name}`} title="Abrir WhatsApp">
                          <MessageCircle className="size-4 text-emerald-600" />
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className={`${styles.contact} mt-5 space-y-3 text-sm text-gray-600`}>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingId(customer.id);
                        setForm({ name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, notes: customer.notes });
                        setFormError(""); setOpen(true);
                      }}><Pencil className="size-4" /> Editar cliente</Button>
                      {!reception && <Button asChild variant="outline" size="sm">
                        <Link href={`/novo-orcamento?cliente=${customer.id}`}><FilePlus className="size-4" /> Novo orçamento</Link>
                      </Button>}
                      {reception && <Button asChild variant="outline" size="sm"><Link href={`/agenda?cliente=${customer.id}`}>Agendar atendimento</Link></Button>}
                    </div>
                    {customer.email && <p className="flex items-center gap-2"><Mail className="size-4 text-gray-400" /> {customer.email}</p>}
                    {customer.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" /> {customer.address}</p>}
                  </div>

                  {!reception && <div className={`${styles.cardFooter} mt-5 flex items-end justify-between border-t border-gray-100 pt-4`}>
                    <div>
                      <p className="text-xs text-gray-500">Total aprovado</p>
                      <p className="mt-1 font-semibold">{formatMoney(quoteSummary.approvedTotal)}</p>
                    </div>
                    <Button asChild variant="ghost" className={`${styles.historyAction} rounded-lg text-blue-700`}>
                      <Link href={`/clientes/${customer.id}`}>Ver histórico</Link>
                    </Button>
                  </div>}
                </article>
              );
            })}
          </div>
        ) : (
          <div className={`${styles.empty} flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-5 py-10 text-center`}>
            <span className="flex size-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Users className="size-6" /></span>
            <h2 className="mt-4 text-lg font-semibold">Nenhum cliente encontrado</h2>
            <p className="mt-2 text-sm text-gray-500">
              {search.trim() ? "Tente outro nome, telefone ou e-mail." : "Cadastre o primeiro contato para começar."}
            </p>
            <Button className="mt-4 h-10 rounded-xl" variant="outline" onClick={search.trim() ? () => setSearch("") : openNewCustomer}>
              {search.trim() ? "Limpar busca" : "Novo cliente"}
            </Button>
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}>
        <DialogContent className={`${styles.dialog} max-h-[90vh] overflow-y-auto rounded-lg bg-white sm:max-w-lg`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${styles.dialogTitle}`}><UserRound className="size-5 text-blue-600" /> {editingId ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>Guarde os dados usados nos orçamentos e cobranças.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nome *</Label>
              <Input id="customer-name" name="name" autoComplete="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-11 rounded-xl" placeholder="Ex.: Maria Silva" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-phone">WhatsApp</Label>
                <Input id="customer-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="h-11 rounded-xl" placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">E-mail</Label>
                <Input id="customer-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-11 rounded-xl" placeholder="cliente@email.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Endereço</Label>
              <Input id="customer-address" name="address" autoComplete="street-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="h-11 rounded-xl" placeholder="Rua, número e bairro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-notes">Observações</Label>
              <Textarea id="customer-notes" name="notes" autoComplete="off" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-24 rounded-xl" placeholder="Preferências, horários ou detalhes importantes" />
            </div>
            <DialogFooter>
              {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 rounded-xl">Cancelar</Button>
              <Button type="submit" disabled={saving} aria-live="polite" className="h-11 rounded-xl">{saving ? "Salvando…" : "Salvar cliente"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
