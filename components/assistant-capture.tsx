"use client";
import { useRef, useState } from "react";
import { Camera, FileAudio, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressPhoto } from "@/lib/photo-upload";

const audioMime: Record<string, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", webm: "audio/webm", wav: "audio/wav" };
function fileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Não foi possível abrir o arquivo.")); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(file); });
}
export function AssistantCapture({ disabled, onReview }: { disabled: boolean; onReview: (text: string) => void }) {
  const [kind, setKind] = useState<"photo" | "audio" | null>(null), [file, setFile] = useState<File | null>(null), [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [text, setText] = useState("");
  const lock = useRef(false);
  async function read() {
    if (!kind || !file || !consent || lock.current) return;
    lock.current = true; setBusy(true); setError(""); setText("");
    try {
      const mime = kind === "photo" ? "image/jpeg" : audioMime[file.name.split(".").at(-1)?.toLowerCase() ?? ""];
      if (!mime || (kind === "audio" && file.size > 4_000_000)) throw new Error("Escolha um áudio MP3, M4A, WebM ou WAV de até 4 MB.");
      const base64 = kind === "photo" ? (await compressPhoto(file)).split(",")[1] : await fileBase64(file);
      const response = await fetch("/api/assistant/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, mime, base64, consent: true }) });
      const data = await response.json(); if (!response.ok || typeof data.text !== "string") throw new Error(data.error || "Não foi possível ler o arquivo.");
      setText(data.text);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível ler o arquivo."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="mt-3 min-w-0 border-t border-gray-200 pt-3" aria-label="Importar pedido">
    <div className="flex flex-wrap gap-2">{(["audio", "photo"] as const).map(value => <Button key={value} type="button" variant="outline" disabled={disabled || busy} aria-pressed={kind === value} onClick={() => { setKind(kind === value ? null : value); setFile(null); setConsent(false); setText(""); setError(""); }}>{value === "audio" ? <FileAudio aria-hidden="true" /> : <Camera aria-hidden="true" />}{value === "audio" ? "Importar áudio" : "Importar foto"}</Button>)}</div>
    {kind && <fieldset disabled={busy || disabled} className="mt-3 grid min-w-0 gap-3"><label className="text-sm font-semibold">{kind === "audio" ? "Áudio de até 4 MB" : "Foto de até 12 MB"}<input className="mt-2 block w-full min-w-0 max-w-full text-sm file:mr-3 file:rounded-md file:border file:border-gray-400 file:bg-white file:px-3 file:py-2" type="file" accept={kind === "audio" ? ".mp3,.m4a,.webm,.wav" : "image/jpeg,image/png,image/webp"} onChange={event => { setFile(event.target.files?.[0] ?? null); setText(""); setError(""); }} /></label>
      <label className="flex items-start gap-2 text-sm leading-6"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={consent} onChange={event => setConsent(event.target.checked)} />Autorizo o envio deste arquivo à IA configurada pelo Vemo. Não inclua senhas, documentos pessoais ou dados que não possa compartilhar.</label>
      <Button className="w-fit" type="button" disabled={!file || !consent || busy} onClick={() => void read()}>{busy && <LoaderCircle className="animate-spin" aria-hidden="true" />}{busy ? "Lendo arquivo..." : "Preparar texto para revisão"}</Button>
      {text && <><label className="text-sm font-semibold">Revisar pedido<textarea rows={5} value={text} maxLength={4000} onChange={event => setText(event.target.value)} className="mt-2 block w-full min-w-0 rounded-md border border-gray-400 p-3 text-base font-normal" /></label><p className="text-sm text-gray-600">{text.length}/400 caracteres para o pedido. Confira nomes, valores e datas; reduza o texto quando necessário.</p><Button type="button" className="w-fit" disabled={!text.trim() || text.length > 400} onClick={() => { onReview(text.trim()); setKind(null); setText(""); setFile(null); }}>Usar texto revisado</Button></>}
    </fieldset>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}
