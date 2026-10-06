"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerMatches } from "@/lib/customer-search";
import type { Customer } from "@/lib/models";

export function AssistantCustomerSearch({ onBack }: { onBack: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const result = useRef<HTMLParagraphElement>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false); setCustomers([]);
    void fetch("/api/customers", { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.customers)) throw new Error();
      if (!controller.signal.aborted) setCustomers(data.customers);
    }).catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const matches = useMemo(() => customers.filter(customer => customerMatches(customer, query)), [customers, query]);
  function submit(event: FormEvent) {
    event.preventDefault(); setQuery(input); setLimit(10);
    requestAnimationFrame(() => result.current?.focus());
  }
  return <div className="space-y-5 py-5">
    <Button variant="ghost" className="h-11 px-0" onClick={onBack}><ArrowLeft className="size-4" />Voltar às consultas</Button>
    <div className="flex items-center justify-between gap-3"><h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-offset-2">Buscar cliente</h2><Button variant="ghost" size="icon" className="size-11 shrink-0" disabled={loading} aria-label="Atualizar clientes" title="Atualizar clientes" onClick={() => setRevision(value => value + 1)}><RefreshCw className="size-4" /></Button></div>
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="assistant-client-search" className="text-sm font-medium">Nome, telefone ou e-mail</label>
      <div className="flex gap-2"><Input ref={search} id="assistant-client-search" type="search" autoComplete="off" maxLength={254} value={input} onChange={event => setInput(event.target.value)} className="h-11 min-w-0 flex-1" /><Button type="submit" size="icon" className="size-11 shrink-0" aria-label="Buscar nos clientes" title="Buscar nos clientes"><Search className="size-4" /></Button></div>
    </form>
    {loading ? <p role="status" className="text-sm text-gray-600">Carregando clientes...</p> : error ? <div role="alert" className="space-y-3 text-sm text-red-700"><p>Não foi possível carregar os clientes.</p><Button variant="outline" className="h-11" onClick={() => setRevision(value => value + 1)}>Tentar novamente</Button></div> : <>
      <p ref={result} tabIndex={-1} role="status" className="break-words text-sm text-gray-600 outline-offset-2">{matches.length} {matches.length === 1 ? "cliente encontrado" : "clientes encontrados"}{query.trim() ? ` para “${query.trim()}”` : ""}. Exibindo {Math.min(limit, matches.length)}.</p>
      {matches.length ? <ul className="divide-y divide-gray-200">{matches.slice(0, limit).map(customer => <li key={customer.id} className="space-y-3 py-4">
        <div><h3 className="break-words font-semibold">{customer.name}</h3><p className="mt-1 text-xs text-gray-500">Cadastro #{customer.id}</p></div>
        <div className="space-y-1 break-words text-sm text-gray-600">{customer.phone ? <p>{customer.phone}</p> : null}{customer.email ? <p>{customer.email}</p> : null}{!customer.phone && !customer.email ? <p>Contato não informado</p> : null}</div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="h-11"><a href={`/clientes/${customer.id}`} aria-label={`Ver histórico de ${customer.name}, cadastro ${customer.id}`}>Ver histórico</a></Button><Button asChild variant="outline" className="h-11"><a href={`/novo-orcamento?cliente=${customer.id}`} aria-label={`Novo orçamento para ${customer.name}, cadastro ${customer.id}`}>Novo orçamento</a></Button></div>
      </li>)}</ul> : <p className="text-sm text-gray-600">{customers.length ? "Tente outro nome ou contato." : "Nenhum cliente cadastrado nesta conta."}</p>}
      {matches.length > limit ? <Button variant="outline" className="h-11 w-full" onClick={() => setLimit(value => value + 10)}>Mostrar mais clientes</Button> : null}
      {query ? <Button variant="ghost" className="h-11" onClick={() => { setInput(""); setQuery(""); setLimit(10); search.current?.focus(); }}>Limpar busca</Button> : null}
    </>}
  </div>;
}
