"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "@/components/settings-workspace.module.css";

const MAX_CHARS = 400_000;

/* Reduz a imagem no próprio navegador (até 640x320) antes de enviar, para o orçamento abrir rápido. */
async function resizeLogo(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível ler esta imagem."));
      element.src = url;
    });
    const scale = Math.min(1, 640 / image.naturalWidth, 320 / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Seu navegador não conseguiu preparar a imagem.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.92, 0.8, 0.65]) {
      const webp = canvas.toDataURL("image/webp", quality);
      const result = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
      if (result.length <= MAX_CHARS) return result;
    }
    throw new Error("A imagem ficou grande demais. Tente um arquivo mais simples.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function BusinessLogoSettings({ businessName }: { businessName?: string }) {
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/business-logo", { cache: "no-store" }).then(async response => {
      const data = await response.json() as { logo?: string | null; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar a logo.");
      if (active) setLogo(data.logo ?? null);
    }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Não foi possível carregar a logo."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setNotice("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Use uma imagem PNG, JPG ou WebP."); return; }
    if (file.size > 8_000_000) { setError("A imagem precisa ter até 8 MB."); return; }
    setSaving(true);
    try {
      const dataUrl = await resizeLogo(file);
      const response = await fetch("/api/business-logo", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo: dataUrl }) });
      const data = await response.json() as { logo?: string; error?: string };
      if (!response.ok || !data.logo) throw new Error(data.error || "Não foi possível salvar a logo.");
      setLogo(data.logo);
      setNotice("Logo salva. Ela já aparece nos seus orçamentos.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível salvar a logo.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (saving || !window.confirm("Remover a logo dos orçamentos?")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/business-logo", { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json() as { error?: string }).error || "Não foi possível remover.");
      setLogo(null);
      setNotice("Logo removida.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível remover.");
    } finally {
      setSaving(false);
    }
  }

  return <section id="logo" className={styles.card} aria-labelledby="logo-heading">
    <div className={styles.cardHead}>
      <span className={styles.cardIcon} data-tone="violet"><ImagePlus aria-hidden="true" /></span>
      <div><h2 id="logo-heading">Logo da empresa</h2><p>Aparece no topo dos seus orçamentos, no link enviado ao cliente e no PDF.</p></div>
    </div>
    <div className={styles.logoRow}>
      <div className={styles.logoBox} data-empty={!logo || undefined}>
        {loading ? <span className={styles.muted}>Carregando…</span> : logo ? <img src={logo} alt="Logo atual da empresa" /> : <span><ImagePlus aria-hidden="true" />Sem logo</span>}
      </div>
      <div className={styles.logoPreview} aria-hidden="true">
        <small>Prévia do orçamento</small>
        <div>
          {logo ? <img src={logo} alt="" /> : <strong>{businessName || "Seu negócio"}</strong>}
          <span>ORÇAMENTO #12</span>
        </div>
        <i /><i /><i />
      </div>
    </div>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} onChange={event => void choose(event)} aria-label="Escolher arquivo da logo" />
    <div className={styles.actionsRow}>
      <Button type="button" disabled={loading || saving} onClick={() => input.current?.click()} className="h-11 rounded-full px-5"><Upload className="size-4" aria-hidden="true" />{saving ? "Enviando…" : logo ? "Trocar logo" : "Enviar logo"}</Button>
      {logo && <Button type="button" variant="outline" disabled={saving} onClick={() => void remove()} className="h-11 rounded-full px-5"><Trash2 className="size-4" aria-hidden="true" />Remover</Button>}
    </div>
    <p className={styles.hint}>PNG, JPG ou WebP. Fundo transparente fica melhor. A imagem é reduzida automaticamente.</p>
    {error && <p role="alert" className={styles.errorText}>{error}</p>}
    {notice && <p role="status" className={styles.successText}>{notice}</p>}
  </section>;
}
