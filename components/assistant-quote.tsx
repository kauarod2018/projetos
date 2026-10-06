"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, type Customer, type Service } from "@/lib/models";

type QuoteRequest = { clientName: string; amountCents: number };

export function AssistantQuote({ onBack, request }: { onBack: () => void; request?: QuoteRequest }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [customerError, setCustomerError] = useState(false);
  const [serviceError, setServiceError] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [revision, setRevision] = useState(0);
  const [review, setReview] = useState<{ customer: Customer | null; clientName: string; service: Service | null } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const customerSelect = useRef<HTMLSelectElement>(null);
  useEffect(() => { heading.current?.focus(); }, [review]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setCustomerError(false); setServiceError(false);
    async function get(url: string, field: string) {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data[field])) throw new Error();
      return data[field];
    }
    void Promise.allSettled([get("/api/customers", "customers"), get("/api/services", "services")]).then(([clients, catalog]) => {
      if (controller.signal.aborted) return;
      if (clients.status === "fulfilled") setCustomers(clients.value);
      else { setCustomers([]); setCustomerError(true); }
      if (catalog.status === "fulfilled") setServices(catalog.value.filter((item: Service) => !item.archived));
      else { setServices([]); setServiceId(""); setServiceError(true); }
      setLoading(false);
    });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    if (!request || loading || customerError) return;
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLowerCase();
    const matches = customers.filter(item => normalize(item.name) === normalize(request.clientName));
    setCustomerId(matches.length === 1 ? String(matches[0].id) : "");
  }, [request, customers, loading, customerError]);
  function prepare(event: FormEvent) {
    event.preventDefault();
    if (loading || customerError) return;
    const customer = customers.find(item => String(item.id) === customerId);
    if (!customer && !request) { setInvalid(true); customerSelect.current?.focus(); return; }
    setReview({ customer: customer ?? null, clientName: customer?.name ?? request!.clientName, service: services.find(item => String(item.id) === serviceId) ?? null });
  }
  function continueQuote() {
    if (!review) return;
    const params = new URLSearchParams();
    if (review.customer) params.set("cliente", String(review.customer.id));
    else params.set("clienteNome", review.clientName);
    if (review.service) params.set("servico", String(review.service.id));
    if (request) params.set("valor", String(request.amountCents));
    window.location.assign(`/novo-orcamento?${params}`);
  }
  const selectClass = "h-11 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-blue-600";
  return <div className="space-y-5 py-5">
    <Button variant="ghost" className="h-11 px-0" onClick={onBack}><ArrowLeft className="size-4" />Voltar às consultas</Button>
    <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-offset-2">{review ? "Revisar preparação" : "Preparar orçamento"}</h2>
    {review ? <>
      <dl className="space-y-4">
        <div><dt className="text-xs text-gray-500">Cliente</dt><dd className="mt-1 break-words font-medium">{review.clientName}</dd><dd className="mt-1 break-words text-sm text-gray-600">{review.customer ? review.customer.phone || `Cadastro #${review.customer.id}` : "Será cadastrado junto com o orçamento, somente quando você salvar."}</dd></div>
        <div><dt className="text-xs text-gray-500">Serviço</dt><dd className="mt-1 break-words font-medium">{review.service?.name ?? "A definir no orçamento"}</dd></div>
        {request ? <div><dt className="text-xs text-gray-500">Valor indicado</dt><dd className="mt-1 text-xl font-semibold text-blue-900">{formatMoney(request.amountCents)}</dd></div> : null}
        {review.service ? <><div><dt className="text-xs text-gray-500">Valor de uma unidade no catálogo</dt><dd className="mt-1 text-xl font-semibold text-emerald-800">{formatMoney(review.service.priceCents)}</dd></div>{review.service.description ? <div><dt className="text-xs text-gray-500">Descrição</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{review.service.description}</dd></div> : null}</> : null}
      </dl>
      <p className="text-sm leading-6 text-gray-600">Orçamento ainda não salvo. Confira e complete os itens, o valor e as condições no editor. A Vemo não enviará nem salvará nada sem sua confirmação.</p>
      <Button className="h-11 w-full" onClick={continueQuote}>Continuar no orçamento</Button>
      <Button variant="outline" className="h-11 w-full" onClick={() => setReview(null)}>Voltar e editar</Button>
      <Button variant="ghost" className="h-11 w-full" onClick={onBack}>Cancelar</Button>
    </> : loading ? <p role="status" className="text-sm text-gray-600">Carregando clientes e serviços...</p> : customerError ? <div role="alert" className="space-y-3 text-sm text-red-700"><p>Não foi possível carregar os clientes.</p><Button variant="outline" className="h-11" onClick={() => setRevision(value => value + 1)}>Tentar novamente</Button></div> : customers.length === 0 ? <div className="space-y-3"><p className="text-sm text-gray-600">Nenhum cliente cadastrado.</p><Button variant="outline" className="h-11" onClick={() => window.location.assign("/clientes?novo=1")}>Cadastrar primeiro cliente</Button></div> : <form onSubmit={prepare} noValidate className="space-y-4">
      {request ? <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950"><p className="font-medium">Rascunho a partir do seu pedido</p><p className="mt-1">Cliente: {request.clientName} · Valor: {formatMoney(request.amountCents)}</p><p className="mt-1">Confirme o cliente abaixo; o serviço e os detalhes serão revisados no editor.</p></div> : null}
      <div className="space-y-2"><label htmlFor="assistant-quote-client" className="text-sm font-medium">Cliente</label><select ref={customerSelect} id="assistant-quote-client" className={selectClass} value={customerId} aria-invalid={invalid} aria-describedby={invalid ? "assistant-quote-error" : undefined} onChange={event => { setCustomerId(event.target.value); setInvalid(false); }}><option value="">{request ? `Usar “${request.clientName}” como novo cliente` : "Escolha um cliente"}</option>{customers.map(item => <option key={item.id} value={item.id}>{item.name} · {item.phone || `Cadastro #${item.id}`}</option>)}</select>{invalid ? <p id="assistant-quote-error" className="text-sm text-red-700">Escolha um cliente ou mantenha o nome informado para cadastrá-lo ao salvar.</p> : null}</div>
      {serviceError ? <div role="alert" className="space-y-2 text-sm text-amber-800"><p>Catálogo indisponível. Você pode definir os itens no editor.</p><Button type="button" variant="outline" className="h-11" onClick={() => setRevision(value => value + 1)}>Tentar carregar catálogo</Button></div> : <div className="space-y-2"><label htmlFor="assistant-quote-service" className="text-sm font-medium">Serviço (opcional)</label><select id="assistant-quote-service" className={selectClass} value={serviceId} onChange={event => setServiceId(event.target.value)}><option value="">Definir no orçamento</option>{services.map(item => <option key={item.id} value={item.id}>{item.name} · {formatMoney(item.priceCents)}</option>)}</select></div>}
      <Button type="submit" className="h-11 w-full">Revisar preparação</Button>
      <Button type="button" variant="ghost" className="h-11 w-full" onClick={onBack}>Cancelar</Button>
    </form>}
  </div>;
}
