"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyBusinessProfile, type BusinessProfile } from "@/lib/business-profile";
import styles from "@/components/settings-workspace.module.css";

export function BusinessProfileSettings() {
  const [profile, setProfile] = useState<BusinessProfile>(emptyBusinessProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/business-profile", { cache: "no-store" }).then(async response => {
      const data = await response.json() as { profile?: BusinessProfile; error?: string };
      if (!response.ok || !data.profile) throw new Error(data.error || "Não foi possível carregar os dados do negócio.");
      if (active) setProfile(data.profile);
    }).catch(failure => {
      if (active) setError(failure instanceof Error ? failure.message : "Não foi possível carregar os dados do negócio.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json() as { profile?: BusinessProfile; error?: string };
      if (!response.ok || !data.profile) throw new Error(data.error || "Não foi possível salvar.");
      setProfile(data.profile);
      setNotice("Dados do Pix salvos.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível salvar. Confira os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`max-w-3xl ${styles.sectionCard} ${styles.pixSettings}`} aria-labelledby="pix-profile-heading">
      <h3 id="pix-profile-heading" className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="size-5 text-blue-700" aria-hidden="true" /> Recebimento por Pix</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">Depois que o cliente aprovar um orçamento com pagamento por Pix, o Vemo mostra o QR Code e o código com o valor total.</p>
      <form onSubmit={save} className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business-pix-key">Chave Pix aleatória</Label>
          <Input id="business-pix-key" name="pixKey" value={profile.pixKey} onChange={event => setProfile(current => ({ ...current, pixKey: event.target.value }))} disabled={loading || saving} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={36} className="h-11 rounded-xl" placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" aria-describedby="business-pix-key-hint" />
          <p id="business-pix-key-hint" className="text-sm text-gray-500">Use a chave aleatória UUID fornecida pelo seu banco. Não informe senha nem dados de acesso.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="business-pix-name">Nome do recebedor</Label>
            <Input id="business-pix-name" name="pixName" value={profile.pixName} onChange={event => setProfile(current => ({ ...current, pixName: event.target.value }))} disabled={loading || saving} autoComplete="organization" maxLength={80} required={Boolean(profile.pixKey)} className="h-11 rounded-xl" placeholder="Como aparece no banco" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-pix-city">Cidade</Label>
            <Input id="business-pix-city" name="pixCity" value={profile.pixCity} onChange={event => setProfile(current => ({ ...current, pixCity: event.target.value }))} disabled={loading || saving} autoComplete="address-level2" maxLength={80} required={Boolean(profile.pixKey)} className="h-11 rounded-xl" placeholder="Ex.: São Paulo" />
          </div>
        </div>
        <p className="text-sm text-amber-800">A aprovação do orçamento não confirma o pagamento. Confira o recebimento no aplicativo do banco antes de marcar como pago.</p>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
        <Button type="submit" disabled={loading || saving} className="h-11 rounded-xl">{saving ? "Salvando…" : loading ? "Carregando…" : "Salvar dados do Pix"}</Button>
      </form>
    </section>
  );
}
