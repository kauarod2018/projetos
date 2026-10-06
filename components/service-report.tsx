"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, ClipboardCheck, Copy, Link2Off, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { emptyReport, type ServiceReport } from "@/lib/service-report-policy";
import { compressPhoto } from "@/lib/photo-upload";
import styles from "./service-report.module.css";

async function request(path: string, method = "GET", body?: unknown) {
  const response = await fetch(path, { method, cache: "no-store", ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || "Não foi possível concluir."); return data;
}

export function ServiceReportButton({ id, title }: { id: number; title: string }) {
  const [open, setOpen] = useState(false), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false);
  const close = (value: boolean) => { if (busy) return; if (!value && dirty && !window.confirm("Descartar as alterações não salvas do relatório?")) return; setOpen(value); };
  return <><Button variant="outline" onClick={() => setOpen(true)}><ClipboardCheck aria-hidden="true" className="size-4" />Relatório</Button><Dialog open={open} onOpenChange={close}><DialogContent className={styles.dialog} showCloseButton={!busy}><DialogHeader><DialogTitle>Relatório do atendimento</DialogTitle><DialogDescription>{title}</DialogDescription></DialogHeader>{open && <ReportEditor id={id} onDirty={setDirty} onBusy={setBusy} />}</DialogContent></Dialog></>;
}

function ReportEditor({ id, onDirty, onBusy }: { id: number; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void }) {
  const [report, setReport] = useState<ServiceReport>({ ...emptyReport, checklist: [], photos: [] });
  const [editable, setEditable] = useState(false), [shareable, setShareable] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [itemLabel, setItemLabel] = useState(""), [caption, setCaption] = useState(""), [kind, setKind] = useState<"before" | "after">("before"), [url, setUrl] = useState("");
  const lock = useRef(false), alive = useRef(true);
  const endpoint = `/api/appointments/${id}/report`;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useEffect(() => { onBusy(busy); }, [busy, onBusy]);
  async function load() {
    setLoading(true); setError("");
    try { const data = await request(endpoint); if (alive.current) { setReport(data.report); setEditable(data.editable); setShareable(data.shareable); setDirty(false); } }
    catch (failure) { if (alive.current) setError(failure instanceof Error ? failure.message : "Falha ao carregar."); }
    finally { if (alive.current) setLoading(false); }
  }
  useEffect(() => { void load(); }, [id]); // Editor is mounted only while its dialog is open.
  function patch(values: Partial<ServiceReport>) { setReport(current => ({ ...current, ...values })); setDirty(true); setUrl(""); setNotice(""); }
  async function run(action: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível concluir."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save() {
    await run(async () => {
      const { version, checklist, photos, summary, acknowledgedBy, nextVisitOn } = report;
      const data = await request(endpoint, "PUT", { version, checklist, photos, summary, acknowledgedBy, nextVisitOn });
      setReport(data.report); setDirty(false); setUrl(""); setNotice("Relatório salvo. Concluir o atendimento não registra pagamento.");
    });
  }
  if (loading) return <p role="status">Carregando relatório...</p>;
  if (!editable && error) return <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => void load()}>Tentar novamente</Button></div>;
  return <div className={styles.editor}>
    <fieldset disabled={!editable || busy} className={styles.section}><legend>Checklist</legend>
      {!report.checklist.length && <p className={styles.muted}>Nenhuma etapa registrada.</p>}
      <ul className={styles.checklist}>{report.checklist.map(item => <li key={item.id}><label><input type="checkbox" checked={item.done} onChange={event => patch({ checklist: report.checklist.map(row => row.id === item.id ? { ...row, done: event.target.checked } : row) })} /><span>{item.label}</span></label>{editable && <Button variant="ghost" size="icon" title="Remover etapa" aria-label={`Remover ${item.label}`} onClick={() => patch({ checklist: report.checklist.filter(row => row.id !== item.id) })}><Trash2 aria-hidden="true" /></Button>}</li>)}</ul>
      {editable && report.checklist.length < 16 && <div className={styles.addRow}><label className="sr-only" htmlFor={`step-${id}`}>Nova etapa</label><input id={`step-${id}`} maxLength={180} value={itemLabel} onChange={event => setItemLabel(event.target.value)} placeholder="Nova etapa" onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (itemLabel.trim()) { patch({ checklist: [...report.checklist, { id: crypto.randomUUID(), label: itemLabel.trim(), done: false }] }); setItemLabel(""); } } }} /><Button variant="outline" size="icon" title="Adicionar etapa" aria-label="Adicionar etapa" disabled={!itemLabel.trim()} onClick={() => { patch({ checklist: [...report.checklist, { id: crypto.randomUUID(), label: itemLabel.trim(), done: false }] }); setItemLabel(""); }}><Plus aria-hidden="true" /></Button></div>}
    </fieldset>
    <fieldset disabled={!editable || busy} className={styles.section}><legend>Fotos da execução</legend>
      <div className={styles.photos}>{report.photos.map(photo => <figure key={photo.id}><img src={photo.data} alt={photo.caption} width={320} height={240} /><figcaption><strong>{photo.kind === "before" ? "Antes" : "Depois"}</strong><p>{photo.caption}</p>{editable && <Button variant="ghost" size="icon" title="Remover foto" aria-label={`Remover foto: ${photo.caption}`} onClick={() => patch({ photos: report.photos.filter(row => row.id !== photo.id) })}><Trash2 aria-hidden="true" /></Button>}</figcaption></figure>)}</div>
      {editable && report.photos.length < 4 && <div className={styles.upload}><label>Momento<select value={kind} onChange={event => setKind(event.target.value as typeof kind)}><option value="before">Antes</option><option value="after">Depois</option></select></label><label>Descrição da foto<input maxLength={120} value={caption} onChange={event => setCaption(event.target.value)} /></label><label className={styles.file}><Camera aria-hidden="true" />Adicionar foto<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={!caption.trim() || busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void run(async () => { const data = await compressPhoto(file); patch({ photos: [...report.photos, { id: crypto.randomUUID(), kind, caption: caption.trim(), data }] }); setCaption(""); }); }} /></label></div>}
      <p className={styles.muted}>{report.photos.length}/4 fotos. Evite documentos, rostos e dados pessoais desnecessários.</p>
    </fieldset>
    <fieldset disabled={!editable || busy} className={styles.section}><legend>Registro do serviço</legend><label>Resumo para o cliente<textarea rows={4} maxLength={2000} value={report.summary} onChange={event => patch({ summary: event.target.value })} /></label><label>Nome de quem confirmou a execução (opcional)<input minLength={2} maxLength={120} value={report.acknowledgedBy ?? ""} onChange={event => patch({ acknowledgedBy: event.target.value || null })} /></label><p className={styles.muted}>Registro informado pela equipe. Não é assinatura digital nem confirmação de pagamento.</p><label>Próxima manutenção (opcional)<input type="date" value={report.nextVisitOn ?? ""} min="2000-01-01" max="2099-12-31" onChange={event => patch({ nextVisitOn: event.target.value || null })} /></label></fieldset>
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status" className={styles.success}>{notice}</p>}
    {editable && <Button disabled={busy || !dirty} onClick={() => void save()}><Save aria-hidden="true" />{busy ? "Aguarde..." : "Salvar relatório"}</Button>}
    {shareable && <section className={styles.section} aria-label="Compartilhamento"><h3>Relatório para o cliente</h3><div className={styles.actions}><Button variant="outline" disabled={busy || dirty || report.version === 0} onClick={() => { if (window.confirm("Compartilhar o resumo, checklist e todas as fotos deste relatório? Qualquer pessoa com o link poderá consultá-los por 7 dias. Contatos, notas privadas e valores não são incluídos.")) void run(async () => { const data = await request(endpoint + "/share", "POST", { version: report.version }); setUrl(data.url); setReport(current => ({ ...current, publicExpiresAt: data.expiresAt })); setNotice("Link criado. Nenhuma mensagem foi enviada."); }); }}><Copy aria-hidden="true" />Criar link</Button>{report.publicExpiresAt && <Button variant="outline" disabled={busy} onClick={() => void run(async () => { await request(endpoint + "/share", "DELETE"); setUrl(""); setReport(current => ({ ...current, publicExpiresAt: null })); setNotice("Link revogado."); })}><Link2Off aria-hidden="true" />Revogar link</Button>}</div>{url && <label>Link válido por 7 dias<input readOnly value={url} onFocus={event => event.target.select()} /><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(url); setNotice("Link copiado."); } catch { setError("Selecione o link acima para copiar."); } }}><Copy aria-hidden="true" />Copiar link</Button></label>}</section>}
  </div>;
}
