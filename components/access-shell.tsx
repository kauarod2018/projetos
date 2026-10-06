import type { ReactNode } from "react";
import { VemoWordmark } from "@/components/vemo-brand";
import styles from "@/components/access-shell.module.css";

export function AccessShell({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`${styles.page} min-h-svh bg-[#f4f8fd] text-[#102343]`}
    >
      <div className="mx-auto grid min-h-svh w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 lg:py-12">
        <aside className="hidden max-w-xl lg:block" aria-label="Sobre a Vemo">
          <VemoWordmark className="h-16 w-64" />
          <p className="mt-12 text-xs font-semibold uppercase text-[#2f62f5]">
            Sua rotina profissional, em ordem
          </p>
          <p className="mt-4 max-w-lg text-[2.6rem] font-semibold leading-[1.15]">
            Mais tempo para fazer o seu trabalho acontecer.
          </p>
          <p className="mt-5 max-w-md text-base leading-7 text-[#5b6b82]">
            Do orçamento ao atendimento e ao recebimento,
            com a rotina do seu negócio no mesmo lugar.
          </p>
          <div className="mt-9 flex items-center gap-3 text-sm font-medium text-[#405570]">
            <span className="h-0.5 w-8 bg-[#19bce5]" aria-hidden="true" />
            Prestadores de serviços e pequenas equipes
          </div>
        </aside>

        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-6 flex justify-center lg:hidden">
            <VemoWordmark className="h-14 w-56" />
          </div>
          {children}
          <p className="mt-6 text-center text-xs text-[#748299]">
            Vemo · Sua secretária operacional
          </p>
        </div>
      </div>
    </main>
  );
}
