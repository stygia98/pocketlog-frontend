import { formatAmount } from "@/lib/money";
import type { Summary } from "@/types/stats";

interface SummaryCardsProps {
  summary: Summary;
}

// STAT-01: 총수입/총지출/잔액 3개 카드. 잔액이 음수면 빨강.
export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">총수입</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-income">{formatAmount(summary.income)}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">총지출</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-expense">{formatAmount(summary.expense)}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">잔액</p>
        <p
          className={`mt-1 text-xl font-semibold tabular-nums ${summary.net < 0 ? "text-destructive" : "text-net"}`}
        >
          {formatAmount(summary.net)}
        </p>
      </div>
    </div>
  );
}
