"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listBudgets, upsertBudgets, type BudgetUpsertItem } from "@/lib/budgets";
import { queryKeys } from "@/lib/queryKeys";

export function useBudgetsQuery(yearMonth: string) {
  return useQuery({
    queryKey: queryKeys.budgets.all({ yearMonth }),
    queryFn: () => listBudgets(yearMonth),
  });
}

// 저장 버튼 하나로 전체 upsert한다(CLAUDE.md 5장) — 개별 항목마다 요청하지 않는다.
// 예산은 대시보드 소진율(stats)에도 영향을 주므로 두 캐시를 함께 무효화한다.
export function useUpsertBudgetsMutation(yearMonth: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: BudgetUpsertItem[]) => upsertBudgets(yearMonth, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all({ yearMonth }) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all() });
    },
  });
}
