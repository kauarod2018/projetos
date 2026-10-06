"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { customerSchema } from "@/lib/validation";

const empty = { name: "", phone: "", email: "", address: "", notes: "" };
const labels = { name: "Nome", phone: "WhatsApp", email: "E-mail", address: "Endereço", notes: "Observações" };
type Fields = typeof empty;
type CustomerRequest = { name: string; phone: string };

export function AssistantCustomer({ onBack, locked, onLockChange, request }: { onBack: () => void; locked: boolean; onLockChange: (value: boolean) => void; request?: CustomerRequest }) {
  const [form, setForm] = useState<Fields>(() => ({ ...empty, name: request?.name ?? "", phone: request?.phone ?? "" }));
  const [review, setReview] = useState<Fields | null>(null);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<number | null>(null);
  const key = useRef("");
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { heading.current?.focus(); }, [review, saved]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  function prepare(event: FormEvent) {
    event.preventDefault();
    const result = customerSchema.safeParse(form);
    if (!result.success) {
      const next: Partial<Fields> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof Fields;
        next[field] = field === "name" ? "Informe o nome do cliente." : field === "email" ? "Informe um e-mail válido ou deixe em branco." : "Revise este campo.";
      }
      setErrors(next);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setErrors({}); setError(""); setReview(result.data);
  }
  async function confirm() {
    if (!review || busy.current || saved) return;
    busy.current = true; onLockChange(true); setError("");
    try {
      key.current ||= crypto.randomUUID();
      const response = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...review, requestKey: key.current }) });
      const data = await response.json();
      if (!response.ok || !Number.isSafeInteger(data.customer?.id) || data.customer.id <= 0) throw new Error(response.status === 409 ? data.error : "Não foi possível confirmar o cadastro. Tente novamente nesta tela ou confira Clientes antes de iniciar outro cadastro.");
      setSaved(data.customer.id);
    } catch (failure) {
      setError(failure instanceof Error && failure.message.startsWith("Esta solicitação") ? failure.message : "Não foi possível confirmar o cadastro. Tente novamente nesta tela ou confira Clientes antes de iniciar outro cadastro.");
    } finally { busy.current = false; onLockChange(false); }
  }
  return <div className="space-y-5 py-5">
    <Button variant="ghost" className="h-11 px-0" disabled={locked} onClick={onBack}><ArrowLeft className="size-4" />Voltar às consultas</Button>
    <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-offset-2">{saved ? "Cliente cadastrado" : review ? "Revisar cliente" : "Cadastrar cliente"}</h2>
    {review ? <>
      <dl className="space-y-4">{(Object.keys(labels) as (keyof Fields)[]).map(field => <div key={field}><dt className="text-xs text-gray-500">{labels[field]}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">{review[field] || "Não informado"}</dd></div>)}</dl>
      {error ? <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm text-red-700 outline-offset-2">{error}</p> : null}
      {saved ? <Button className="h-11 w-full" onClick={() => window.location.assign(`/clientes/${saved}`)}>Abrir cliente</Button> : <div className="flex flex-col gap-2">
        <Button className="h-11" disabled={locked} onClick={confirm}>{locked ? "Salvando cliente..." : "Confirmar cadastro"}</Button>
        <Button variant="outline" className="h-11" disabled={locked} onClick={() => { setReview(null); setError(""); }}>Voltar e editar</Button>
        <Button variant="ghost" className="h-11" disabled={locked} onClick={onBack}>Cancelar</Button>
      </div>}
    </> : <form ref={formRef} onSubmit={prepare} noValidate className="space-y-4">
      {(Object.keys(labels) as (keyof Fields)[]).map(field => {
        const props = { id: `assistant-customer-${field}`, name: field, value: form[field], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setForm(current => ({ ...current, [field]: event.target.value })); setErrors(current => ({ ...current, [field]: undefined })); }, "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `customer-error-${field}` : undefined };
        return <div key={field} className="space-y-2">
          <label htmlFor={props.id} className="text-sm font-medium">{labels[field]}{field === "name" ? " (obrigatório)" : " (opcional)"}</label>
          {field === "notes" ? <Textarea {...props} maxLength={1000} rows={3} /> : <Input {...props} required={field === "name"} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} autoComplete={field === "phone" ? "tel" : field === "address" ? "street-address" : field} maxLength={{ name: 120, phone: 30, email: 254, address: 300 }[field]} className="h-11" />}
          {errors[field] ? <p id={`customer-error-${field}`} className="text-sm text-red-700">{errors[field]}</p> : null}
        </div>;
      })}
      <Button type="submit" className="h-11 w-full">Revisar cadastro</Button>
      <Button type="button" variant="ghost" className="h-11 w-full" onClick={onBack}>Cancelar</Button>
    </form>}
  </div>;
}
