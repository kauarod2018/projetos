import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/models";
import type { HistoryReceipt } from "@/lib/customer-history";

export function CustomerReceiptList({ records }: { records: HistoryReceipt[] }) {
  return records.map(receipt => <li key={receipt.id} className="space-y-3 py-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-semibold">Recebimento #{receipt.id}</h3>
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"><CheckCircle2 className="size-4" aria-hidden="true" />Registrado</span>
    </div>
    <p className="whitespace-pre-line break-words text-sm text-gray-600">{receipt.description}</p>
    <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
      <div><dt className="text-gray-500">Recebido em</dt><dd className="mt-1 font-medium">{formatDate(receipt.transactionDate)}</dd></div>
      <div><dt className="text-gray-500">Registrado em</dt><dd className="mt-1">{formatDate(receipt.createdAt)}</dd></div>
    </dl>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <strong className="break-all tabular-nums text-emerald-800">{formatMoney(receipt.amountCents)}</strong>
      <Link href={`/orcamentos/${receipt.quoteId}`} className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-blue-700 focus-visible:outline-2">Orçamento #{receipt.quoteId}<ArrowRight className="size-4" aria-hidden="true" /></Link>
    </div>
  </li>);
}
