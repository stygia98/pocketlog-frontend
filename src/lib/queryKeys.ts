// React Query 쿼리 키 규약 (CLAUDE.md 9장이 정본). 화면·훅은 이 팩토리만 써서 키를 만든다.
// 하위 키는 상위 배열을 접두사로 포함하므로, invalidateQueries({ queryKey: queryKeys.stats.all() })처럼
// 상위 키만 넘겨도 그 아래 모든 변형(예: 서로 다른 yearMonth의 stats.monthly)이 함께 무효화된다.

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
    all: (params: BudgetsParams) => ["budgets", params] as const,
  },
  auth: {
    me: () => ["auth", "me"] as const,
  },
};
