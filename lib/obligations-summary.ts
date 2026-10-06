export type ObligationSummaryRow = {
  bucket: string;
  type: string;
  count: number | string;
  remainingCents: number | string;
};

type ObligationSummaryPart = { count: number; remainingCents: number };
export type ObligationSummary = {
  overdue: { receivable: ObligationSummaryPart; payable: ObligationSummaryPart };
  upcoming: { receivable: ObligationSummaryPart; payable: ObligationSummaryPart };
};

function emptyPart(): ObligationSummaryPart {
  return { count: 0, remainingCents: 0 };
}

export function summarizeObligationRows(rows: ObligationSummaryRow[]): ObligationSummary {
  const summary: ObligationSummary = {
    overdue: { receivable: emptyPart(), payable: emptyPart() },
    upcoming: { receivable: emptyPart(), payable: emptyPart() },
  };

  for (const row of rows) {
    if ((row.bucket !== "overdue" && row.bucket !== "upcoming") || (row.type !== "receivable" && row.type !== "payable")) continue;
    const part = summary[row.bucket][row.type];
    part.count = Math.max(0, Number(row.count) || 0);
    part.remainingCents = Math.max(0, Number(row.remainingCents) || 0);
  }

  return summary;
}
