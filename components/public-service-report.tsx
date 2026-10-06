"use client";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { VemoWordmark } from "./vemo-brand";
import { Button } from "./ui/button";
import { formatDate } from "@/lib/models";
import type { ServiceReport } from "@/lib/service-report-policy";
type Report = Pick<ServiceReport, "summary" | "photos" | "checklist" | "nextVisitOn"> & { title: string; provider: string; startsAt: string; status: string };
export function PublicServiceReport() {
  const [report, setReport] = useState<Report | null>(null), [error, setError] = useState("");
  useEffect(() => {
    const token = window.location.hash.slice(1), controller = new AbortController();
    if (!token) { setError("Link indisponível. Solicite o relatório ao prestador."); return; }
    void fetch("/api/public/service-report", { headers: { "x-report-token": token }, cache: "no-store", signal: controller.signal }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setReport(data.report); }).catch(failure => { if (!controller.signal.aborted) setError(failure.message || "Relatório indisponível."); });
    return () => controller.abort();
  }, []);
  return <main id="main-content" className="mx-auto min-h-screen max-w-3xl bg-white px-5 py-8 text-[#102238] sm:px-8"><header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#dbe6f0] pb-5"><VemoWordmark className="h-12 w-44" />{report && <Button className="print-hidden min-h-11" variant="outline" onClick={() => window.print()}><Printer aria-hidden="true" />Imprimir</Button>}</header>{error ? <p role="alert">{error}</p> : !report ? <p role="status">Carregando relatório...</p> : <article className="space-y-7"><div><p className="text-sm text-[#53647b]">{report.provider}</p><h1 className="mt-2 break-words text-2xl font-semibold">{report.title}</h1><p className="mt-2 text-[#53647b]">{formatDate(report.startsAt)} às {report.startsAt.slice(11)} · {report.status}</p></div>{report.summary && <section><h2 className="mb-3 text-lg font-semibold">Registro do serviço</h2><p className="whitespace-pre-line break-words leading-7">{report.summary}</p></section>}{report.checklist.length > 0 && <section><h2 className="mb-3 text-lg font-semibold">Etapas</h2><ul className="space-y-3">{report.checklist.map((item, index) => <li key={index} className="break-words"><span className="mr-2 font-semibold">{item.done ? "Concluída" : "Pendente"}</span>{item.label}</li>)}</ul></section>}{report.photos.length > 0 && <section><h2 className="mb-3 text-lg font-semibold">Fotos da execução</h2><div className="grid gap-5 sm:grid-cols-2">{report.photos.map((photo, index) => <figure key={index} className="min-w-0"><img src={photo.data} alt={photo.caption} width={640} height={480} className="aspect-[4/3] w-full rounded-md bg-[#eef3f8] object-contain" /><figcaption className="mt-2 break-words text-sm leading-6"><strong>{photo.kind === "before" ? "Antes" : "Depois"}</strong> · {photo.caption}</figcaption></figure>)}</div></section>}{report.nextVisitOn && <p className="border-t border-[#dbe6f0] pt-5">Próxima manutenção prevista: <strong>{formatDate(report.nextVisitOn)}</strong></p>}<footer className="border-t border-[#dbe6f0] pt-5 text-sm text-[#53647b]">Relatório de execução. Não é comprovante de pagamento.</footer></article>}</main>;
}
