import { BudgetBar } from "@/components/chart/BudgetBar";
import type { BudgetStat } from "@/types/stats";

interface BudgetUsageProps {
  budgets: BudgetStat[];
}

// BUD-03, BUD-04. BudgetBar(components/chart)는 수정하지 않는다 — budget===0 분기와 초과 시
// 빨강 처리를 Phase7에서 이미 구현해 뒀다. 여기서는 실제 데이터만 그 모양으로 바꾼다.
export function BudgetUsage({ budgets }: BudgetUsageProps) {
  if (budgets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">예산 소진율</p>
        <p className="mt-2 text-sm">설정된 예산이 없어요</p>
      </div>
    );
  }

  const data = budgets.map((budget) => ({
    name: budget.name,
    spent: budget.spent,
    budget: budget.budget,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">예산 소진율</p>
      <div className="mt-3">
        <BudgetBar data={data} />
      </div>
    </div>
  );
}
