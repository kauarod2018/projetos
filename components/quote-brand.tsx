"use client";
import { useState } from "react";
import { VemoWordmark } from "@/components/vemo-brand";

/* Topo do orçamento: logo da empresa quando existir; sem logo, mantém a marca Vemo. */
export function QuoteBrand({ src, ownerName }: { src?: string | null; ownerName: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`Logo de ${ownerName}`} onError={() => setFailed(true)} className="block h-auto max-h-16 w-auto max-w-[220px] object-contain object-left" />;
  }
  return <VemoWordmark className="h-11 w-44" />;
}
