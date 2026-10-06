import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { NewQuoteForm } from "@/components/new-quote-form";
import { WorkspaceShell } from "@/components/workspace-shell";
import styles from "@/components/quote-workspace.module.css";

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ editar?: string; duplicar?: string }> }) {
  const params = await searchParams;
  return (
    <WorkspaceShell>
    <div>
      <section className={`${styles.formPage} mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8`}>
        <Link
          className="inline-flex w-fit items-center gap-2 rounded-xl px-1 py-2 text-sm font-medium text-gray-600 hover:text-gray-950"
          href="/dashboard"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                {params.editar ? "Editar orçamento" : params.duplicar ? "Duplicar orçamento" : "Criar novo orçamento"}
              </h1>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                {params.editar ? "Revise os dados antes de salvar." : "Cliente, serviços e condições de pagamento."}
              </p>
            </div>
          </div>

          <NewQuoteForm key={params.editar ? `edit-${params.editar}` : params.duplicar ? `copy-${params.duplicar}` : "new"} />
        </div>
      </section>
    </div>
    </WorkspaceShell>
  );
}
