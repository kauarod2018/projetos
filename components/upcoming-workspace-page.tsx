"use client";

import Link from "next/link";
import { CalendarDays, Package } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Button } from "@/components/ui/button";

export function UpcomingWorkspacePage({ kind }: { kind: "agenda" | "services" }) {
  const agenda = kind === "agenda";
  const Icon = agenda ? CalendarDays : Package;
  return <WorkspaceShell>
    <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-semibold">{agenda ? "Agenda" : "Serviços"}</h1>
      <div className="mt-12 max-w-lg border-t border-gray-200 pt-8">
        <Icon className="size-9 text-gray-400" aria-hidden="true" />
        <h2 className="mt-5 text-xl font-semibold">{agenda ? "Sua agenda está sendo preparada" : "Seu catálogo de serviços está sendo preparado"}</h2>
        <p className="mt-3 leading-7 text-gray-600">{agenda ? "Em breve, seus compromissos e atendimentos terão um lugar aqui. O agendamento ainda não está disponível." : "Em breve, você poderá cadastrar preços e durações para usar nos orçamentos e agendamentos. O cadastro de serviços ainda não está disponível."}</p>
        <Button asChild variant="outline" className="mt-6 h-11 rounded-lg"><Link href="/hoje">Voltar para Hoje</Link></Button>
      </div>
    </section>
  </WorkspaceShell>;
}
