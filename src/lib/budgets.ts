import { apiClient } from "@/lib/apiClient";
import type { BudgetItem } from "@/types/budget";

export function listBudgets(yearMonth: string): Promise<BudgetItem[]> {
  return apiClient.get<BudgetItem[]>("/budgets", { yearMonth });
}

export interface BudgetUpsertItem {
  categoryId: number;
  amount: number | null;
}

// amount가 0 또는 null인 항목은 서버가 해당 행을 제거한다(CLAUDE.md 5장) — 별도 삭제 API가 없다.
export function upsertBudgets(yearMonth: string, items: BudgetUpsertItem[]): Promise<BudgetItem[]> {
  return apiClient.put<BudgetItem[]>("/budgets", { yearMonth, items });
}
