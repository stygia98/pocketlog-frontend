// React Query 쿼리 키 규약 (CLAUDE.md 9장이 정본). 화면·훅은 이 팩토리만 써서 키를 만든다.
// 하위 키는 상위 배열을 접두사로 포함하므로, invalidateQueries({ queryKey: queryKeys.stats.all() })처럼
// 상위 키만 넘겨도 그 아래 모든 변형(예: 서로 다른 yearMonth의 stats.monthly)이 함께 무효화된다.

import type { QueryClient } from "@tanstack/react-query";

export interface TransactionListParams {
  page: number;
  size: number;
  type?: "INCOME" | "EXPENSE";
  categoryId?: number;
  from?: string;
  to?: string;
  keyword?: string;
}

export interface MonthlyStatsParams {
  yearMonth: string;
  asOf: string;
}

export interface RecurringStatsParams {
  asOf: string;
}

export interface BudgetsParams {
  yearMonth: string;
}

export const queryKeys = {
  transactions: {
    all: () => ["transactions"] as const,
    list: (params: TransactionListParams) => ["transactions", params] as const,
    // 모바일 무한 스크롤 전용(useInfiniteQuery) — page는 pageParam이 대신 관리하므로 키에서 뺀다.
    infiniteList: (params: Omit<TransactionListParams, "page">) =>
      ["transactions", "infinite", params] as const,
    detail: (id: number) => ["transactions", id] as const,
  },
  categories: {
    all: () => ["categories"] as const,
  },
  stats: {
    all: () => ["stats"] as const,
    monthly: (params: MonthlyStatsParams) => ["stats", "monthly", params] as const,
    recurring: (params: RecurringStatsParams) => ["stats", "recurring", params] as const,
  },
  budgets: {
    root: () => ["budgets"] as const,
    all: (params: BudgetsParams) => ["budgets", params] as const,
  },
  auth: {
    me: () => ["auth", "me"] as const,
  },
};

// 거래·CSV 가져오기처럼 거래 데이터를 바꾸는 mutation은 전부 이 셋을 함께 무효화한다.
// 대시보드(stats)·예산(budgets)이 거래 합계에 의존하므로 빠뜨리면 화면 간 숫자가 어긋난다(CLAUDE.md 9장).
export function invalidateTransactionRelatedQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.stats.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.budgets.root() });
}
