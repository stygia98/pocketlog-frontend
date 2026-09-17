// 백엔드 MonthlyStatsResponse/RecurringResponse와 1:1로 맞춘 타입. 금액은 서버가 JSON 숫자로 내려준다.

export interface Summary {
  income: number;
  expense: number;
  net: number;
}

export interface CategoryStat {
  categoryId: number;
  name: string;
  color: string;
  deleted: boolean;
  amount: number;
  ratio: number;
}

export interface DailyStat {
  date: string;
  expense: number;
  income: number;
}

// 직전 3개월 데이터가 전혀 없으면 forecast 전체가 null이다(CLAUDE.md 5장).
export interface Forecast {
  confirmedExpense: number;
  projectedExpense: number;
  baselineDailyAvg: number;
  daysElapsed: number;
  daysInMonth: number;
  basisMonths: number;
}

export interface Anomaly {
  categoryId: number;
  name: string;
  currentPace: number;
  baseline: number;
  deltaRatio: number;
}

export interface BudgetStat {
  categoryId: number;
  name: string;
  budget: number;
  spent: number;
  usageRatio: number;
  exceeded: boolean;
}

export interface MonthlyStats {
  yearMonth: string;
  summary: Summary;
  byCategory: CategoryStat[];
  daily: DailyStat[];
  forecast: Forecast | null;
  anomalies: Anomaly[];
  budgets: BudgetStat[];
}

export interface Recurring {
  merchant: string;
  categoryId: number;
  medianAmount: number;
  monthsSeen: number;
  lastDate: string;
}
