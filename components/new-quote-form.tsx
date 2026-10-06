"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, MessageCircle, Plus, Sparkles, Trash2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, type Customer, type Quote, type Service } from "@/lib/models";
import { QuoteServicePicker } from "@/components/quote-service-picker";
import { servicePriceInput, serviceQuoteItem } from "@/lib/service-catalog";
import { whatsappLink } from "@/lib/whatsapp";
import { canEditQuote } from "@/lib/quote-editing";

type DraftItem = {
  key: number;
  kind: "service" | "material";
  description: string;
  quantity: string;
  unitPrice: string;
};

type WebMcpContext = {
  registerTool?: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => { ok: boolean; clientName: string };
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseMoney(value: string) {
  const clean = value.replace(/R\$/g, "").replace(/\s/g, "");
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

export function NewQuoteForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("editar");
  const sourceId = editId || searchParams.get("duplicar");
  const assistantAmount = searchParams.get("valor");
  const assistantAmountCents = !sourceId && assistantAmount && /^\d{1,12}$/.test(assistantAmount) && Number(assistantAmount) > 0 && Number(assistantAmount) <= 100_000_000_000 ? Number(assistantAmount) : null;
  const [loadingSource, setLoadingSource] = useState(!!sourceId);
  const [sourceError, setSourceError] = useState("");
  const [expectedToken, setExpectedToken] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(searchParams.get("cliente") ?? "new");
  const [customer, setCustomer] = useState({ name: searchParams.get("clienteNome")?.slice(0, 120) ?? "", phone: "", email: "", address: "" });
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { key: 1, kind: "service", description: "", quantity: "1", unitPrice: assistantAmountCents === null ? "" : (assistantAmountCents / 100).toFixed(2).replace(".", ",") },
  ]);
  const [discount, setDiscount] = useState("");
  const [validUntil, setValidUntil] = useState(futureDate(7));
  const [deadline, setDeadline] = useState("Até 7 dias após a aprovação");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [createdQuote, setCreatedQuote] = useState<Quote | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sourceId) return;
    let active = true;
    setLoadingSource(true);
    setSourceError("");
    void fetch(`/api/quotes/${encodeURIComponent(sourceId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { quote?: Quote; error?: string };
        if (!response.ok || !data.quote) throw new Error(data.error || "Orçamento não encontrado.");
        if (editId && !canEditQuote(data.quote)) throw new Error("Este orçamento está protegido. Volte e escolha Criar nova versão.");
        if (!active) return;
        const quote = data.quote;
        setExpectedToken(quote.publicToken);
        setCustomerId(String(quote.customerId));
        setDescription(quote.description);
        setItems(quote.items.map((item, index) => ({ key: index + 1, kind: item.kind, description: item.description, quantity: String(item.quantity), unitPrice: (item.unitPriceCents / 100).toFixed(2).replace(".", ",") })));
        setDiscount((quote.discountCents / 100).toFixed(2).replace(".", ","));
        setValidUntil(editId ? quote.validUntil : futureDate(7));
        setDeadline(quote.deadline);
        setPaymentMethod(quote.paymentMethod);
      }).catch((failure) => { if (active) setSourceError(failure instanceof Error ? failure.message : "Não foi possível carregar."); })
      .finally(() => { if (active) setLoadingSource(false); });
    return () => { active = false; };
  }, [sourceId, editId]);

  useEffect(() => {
    void fetch("/api/customers", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ customers?: Customer[] }>)
      .then((data) => setCustomers(data.customers ?? []))
      .catch(() => setCustomers([]));
  }, []);

  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + Math.round(Number(item.quantity || 0) * parseMoney(item.unitPrice)), 0),
    [items],
  );
  const totalCents = Math.max(0, subtotalCents - parseMoney(discount));

  const selectedCustomer = customers.find((item) => String(item.id) === customerId);
  const clientName = selectedCustomer?.name || customer.name.trim() || "cliente";
  const approvalLink = createdQuote && typeof window !== "undefined" ? `${window.location.origin}/aprovar/${createdQuote.publicToken}` : "";
  const professionalMessage = createdQuote
    ? `Olá, ${createdQuote.client.name}! Preparei o orçamento #${createdQuote.id} no valor de ${formatMoney(createdQuote.totalCents)}. Ele é válido até ${dateFormatter.format(new Date(`${createdQuote.validUntil}T12:00:00`))}. Confira e aprove: ${approvalLink}`
    : "";
  const whatsappHref = whatsappLink(createdQuote?.client.phone ?? "", professionalMessage);

  function updateItem(key: number, field: keyof DraftItem, value: string) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  }

  const addCatalogService = useCallback((service: Service) => {
    const snapshot = serviceQuoteItem(service);
    setItems(current => {
      const item: DraftItem = { key: Math.max(0, ...current.map(row => row.key)) + 1, kind: snapshot.kind, description: snapshot.description, quantity: "1", unitPrice: servicePriceInput(snapshot.unitPriceCents) };
      if (current.length === 1 && current[0].kind === "service" && !current[0].description.trim() && !current[0].unitPrice.trim() && current[0].quantity === "1") return [item];
      return current.length < 100 ? [...current, item] : current;
    });
  }, []);

  async function submitQuote(event: FormEvent) {
    event.preventDefault();
    if (saving || loadingSource || sourceError) return;
    if (createdQuote) { setOpen(true); return; }
    setSaving(true);
    setError("");

    try {
      const response = await fetch(editId ? `/api/quotes/${encodeURIComponent(editId)}` : "/api/quotes", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedToken: editId ? expectedToken : undefined,
          customerId: customerId === "new" ? undefined : Number(customerId),
          customer: customerId === "new" ? customer : undefined,
          description,
          validUntil,
          deadline,
          paymentMethod,
          discountCents: parseMoney(discount),
          items: items.map((item) => ({
            kind: item.kind,
            description: item.description,
            quantity: Number(item.quantity),
            unitPriceCents: parseMoney(item.unitPrice),
          })),
        }),
      });
      const data = (await response.json()) as { quote?: Quote; error?: string };
      if (!response.ok || !data.quote) throw new Error(data.error);
      setCreatedQuote(data.quote);
      setOpen(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o orçamento.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const context = (document as Document & { modelContext?: WebMcpContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "stage_quote_draft",
            title: "Preencher orçamento",
            description: "Preenche cliente, descrição e valor de um novo orçamento.",
            inputSchema: {
              type: "object",
              properties: {
                clientName: { type: "string" },
                description: { type: "string" },
                estimatedValue: { type: "string" },
              },
              required: ["clientName", "description", "estimatedValue"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input) {
              const payload = input as { clientName?: unknown; description?: unknown; estimatedValue?: unknown };
              if (typeof payload.clientName !== "string" || typeof payload.description !== "string" || typeof payload.estimatedValue !== "string") {
                throw new Error("Dados do orçamento inválidos.");
              }
              setCustomerId("new");
              setCustomer((current) => ({ ...current, name: payload.clientName as string }));
              setDescription(payload.description);
              setItems([{ key: Date.now(), kind: "service", description: payload.description, quantity: "1", unitPrice: payload.estimatedValue }]);
              return { ok: true, clientName: payload.clientName };
            },
          },
          { signal: lifecycle.signal },
        ),
      );
    } catch {
      return;
    }

    return () => lifecycle.abort();
  }, []);

  if (loadingSource) return <p role="status">Carregando orçamento…</p>;
  if (sourceError) return <p role="alert" className="text-red-700">{sourceError}</p>;

  return (
    <>
      <form className="space-y-7" onSubmit={submitQuote}>
        {editId && <p className="text-sm text-amber-800">Ao salvar, o link anterior será invalidado. Envie o novo link ao cliente.</p>}
        {sourceId && !editId && <p className="text-sm text-blue-700">Novo orçamento baseado no #{sourceId}. O original será mantido.</p>}
        {assistantAmountCents !== null && <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">A Vemo preencheu o valor de {formatMoney(assistantAmountCents)}. Confira o valor e descreva o serviço antes de salvar; este rascunho ainda não foi registrado nem enviado.</p>}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Cliente</h2>
            <p className="mt-1 text-sm text-gray-500">Escolha um contato salvo ou cadastre um novo.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-select">Cliente</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="customer-select" className="h-12 w-full rounded-xl border-gray-200 bg-white text-base">
                <SelectValue placeholder="Escolha um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Novo cliente</SelectItem>
                {customers.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {customerId === "new" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="clientName">Nome do cliente *</Label>
                <Input id="clientName" name="clientName" autoComplete="name" required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} className="h-12 rounded-xl" placeholder="Ex.: Carlos Pereira" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">WhatsApp</Label>
                <Input id="clientPhone" name="clientPhone" type="tel" inputMode="tel" autoComplete="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} className="h-12 rounded-xl" placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">E-mail</Label>
                <Input id="clientEmail" name="clientEmail" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} className="h-12 rounded-xl" placeholder="cliente@email.com" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="clientAddress">Endereço</Label>
                <Input id="clientAddress" name="clientAddress" autoComplete="street-address" value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} className="h-12 rounded-xl" placeholder="Rua, número e bairro" />
              </div>
            </div>
          )}
        </section>

        <div className="border-t border-gray-100" />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Itens do orçamento</h2>
            <p className="mt-1 text-sm text-gray-500">Separe serviços e materiais para o cliente entender o valor.</p>
          </div>

          <QuoteServicePicker initialServiceId={sourceId ? null : searchParams.get("servico")} onAdd={addCatalogService} disabled={saving || Boolean(createdQuote)} canAdd={items.length < 100} />

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.key} className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-[140px_1fr_90px_140px_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor={`type-${item.key}`}>Tipo</Label>
                  <Select value={item.kind} onValueChange={(value) => updateItem(item.key, "kind", value)}>
                    <SelectTrigger id={`type-${item.key}`} className="h-11 w-full rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Mão de obra</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`item-${item.key}`}>Descrição *</Label>
                  <Input id={`item-${item.key}`} name={`item-${item.key}`} autoComplete="off" required maxLength={500} value={item.description} onChange={(event) => updateItem(item.key, "description", event.target.value)} className="h-11 rounded-xl bg-white" placeholder={item.kind === "material" ? "Ex.: Cabo elétrico 10 m" : "Ex.: Instalação elétrica"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`qty-${item.key}`}>Qtd.</Label>
                  <Input id={`qty-${item.key}`} name={`quantity-${item.key}`} autoComplete="off" required min="0.01" step="0.01" type="number" value={item.quantity} onChange={(event) => updateItem(item.key, "quantity", event.target.value)} className="h-11 rounded-xl bg-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`price-${item.key}`}>Valor unitário</Label>
                  <Input id={`price-${item.key}`} name={`unitPrice-${item.key}`} autoComplete="off" required inputMode="decimal" value={item.unitPrice} onChange={(event) => updateItem(item.key, "unitPrice", event.target.value)} className="h-11 rounded-xl bg-white" placeholder="0,00" />
                </div>
                <Button type="button" variant="ghost" size="icon" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((currentItem) => currentItem.key !== item.key))} className="size-11 rounded-xl text-red-600" aria-label={`Remover item ${index + 1}`} title="Remover item">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" className="h-11 rounded-xl" disabled={items.length >= 100} onClick={() => setItems((current) => [...current, { key: Math.max(0, ...current.map(row => row.key)) + 1, kind: "service", description: "", quantity: "1", unitPrice: "" }])}>
            <Plus className="size-4" /> Adicionar item
          </Button>
        </section>

        <div className="border-t border-gray-100" />

        <section className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Detalhes do serviço</Label>
            <Textarea id="description" name="description" autoComplete="off" className="min-h-28 rounded-xl text-base leading-6" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: materiais inclusos, garantia de 3 meses e limpeza após o serviço." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="validUntil">Validade do orçamento</Label>
              <Input id="validUntil" name="validUntil" autoComplete="off" required type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo de execução</Label>
              <Input id="deadline" name="deadline" autoComplete="off" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="h-12 rounded-xl" placeholder="Ex.: 5 dias úteis" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Forma de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="50% na entrada e 50% na entrega">50% na entrada e 50% na entrega</SelectItem>
                  <SelectItem value="A combinar">A combinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto (R$)</Label>
              <Input id="discount" name="discount" autoComplete="off" inputMode="decimal" value={discount} onChange={(event) => setDiscount(event.target.value)} className="h-12 rounded-xl" placeholder="0,00" />
            </div>
          </div>
        </section>

        <div className="rounded-xl bg-blue-50 p-4 text-blue-950">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatMoney(subtotalCents)}</span></div>
          <div className="mt-2 flex justify-between text-sm"><span>Desconto</span><span>- {formatMoney(parseMoney(discount))}</span></div>
          <div className="mt-3 flex justify-between border-t border-blue-100 pt-3 text-lg font-semibold"><span>Total</span><span>{formatMoney(totalCents)}</span></div>
        </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button asChild className="h-12 rounded-xl" variant="outline"><Link href="/dashboard">Cancelar</Link></Button>
          <Button className="h-12 rounded-xl bg-indigo-700 px-5 text-base text-white hover:bg-indigo-800" type="submit" disabled={saving} aria-live="polite">
            <Sparkles className="size-4" aria-hidden="true" /> {saving ? "Salvando…" : createdQuote ? "Ver orçamento salvo" : editId ? "Salvar alterações" : "Criar orçamento"}
          </Button>
        </div>
      </form>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-w-xl rounded-2xl border-gray-200 bg-white p-0 shadow-xl">
          <div className="border-b border-gray-100 px-6 py-5">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-xl text-gray-950"><CheckCircle2 className="size-5 text-emerald-600" /> Orçamento pronto</DialogTitle>
              <DialogDescription>O orçamento de {clientName} foi salvo e organizado.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-700">{professionalMessage}</div>
          </div>
          <DialogFooter className="gap-3 px-6 pb-6 sm:justify-between">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href={createdQuote ? `/orcamentos/${createdQuote.id}` : "/dashboard"}><Eye className="size-4" /> Ver orçamento</Link>
            </Button>
            <Button asChild className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              <a href={whatsappHref} rel="noreferrer" target="_blank"><MessageCircle className="size-4" /> Enviar pelo WhatsApp</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
