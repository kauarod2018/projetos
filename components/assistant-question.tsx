"use client";

import { useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantCapture } from "@/components/assistant-capture";
import { parseAssistantInput, recognizeAssistantInput, type AssistantInput } from "@/lib/assistant-question";

export function AssistantQuestion({ onQuery }: { onQuery: (input: AssistantInput | null) => void }) {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    const recognized = recognizeAssistantInput(question);
    if (recognized) { setError(""); onQuery(recognized); return; }
    if (!question.trim()) {
      setError("Escreva um pedido ou escolha uma opção abaixo.");
      onQuery(null); input.current?.focus(); return;
    }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/assistant/interpret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question.trim() }) });
      const data = await response.json() as { input?: unknown; reply?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível interpretar o pedido.");
      const intent = parseAssistantInput(data.input);
      if (!intent) { setError(data.reply || "Me diga o dado que está faltando ou escolha uma opção guiada."); onQuery(null); input.current?.focus(); return; }
      onQuery(intent);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não consegui entender. Tente novamente ou escolha uma opção guiada.");
      onQuery(null); input.current?.focus();
    } finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="mt-5" noValidate>
    <label htmlFor="assistant-question" className="text-sm font-semibold">O que você precisa resolver?</label>
    <div className="mt-2 flex gap-2">
      <input ref={input} id="assistant-question" value={question} onChange={event => { setQuestion(event.target.value); setError(""); }} maxLength={400} autoComplete="off" disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? "assistant-question-error" : "assistant-question-privacy"} placeholder="Ex.: Registra R$ 180 que recebi do Carlos" className="h-11 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-blue-600" />
      <Button type="submit" size="icon" className="size-11 shrink-0" disabled={loading} aria-label={loading ? "Interpretando pedido" : "Enviar pedido"} title={loading ? "Interpretando pedido" : "Enviar pedido"}>{loading ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}</Button>
    </div>
    <p id="assistant-question-privacy" className="mt-2 text-xs leading-5 text-gray-500">Frases reconhecidas ficam no Vemo. Se precisar da interpretação ampliada, o texto será enviado à IA configurada pelo Vemo. Confira tudo antes de confirmar; nada é salvo automaticamente.</p>
    {error ? <p id="assistant-question-error" role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
    <AssistantCapture disabled={loading} onReview={text => { setQuestion(text); setError(""); input.current?.focus(); }} />
  </form>;
}
