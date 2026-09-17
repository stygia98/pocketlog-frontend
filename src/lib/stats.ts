import { apiClient } from "@/lib/apiClient";
import type { MonthlyStats, Recurring } from "@/types/stats";

export function fetchMonthlyStats(yearMonth: string, asOf: string): Promise<MonthlyStats> {
  return apiClient.get<MonthlyStats>("/stats/monthly", { yearMonth, asOf });
}

// 최근 3개월 스캔이라 비용이 커 monthly와 별도 API로 분리되어 있다(CLAUDE.md 5장).
export function fetchRecurring(asOf: string): Promise<Recurring[]> {
  return apiClient.get<Recurring[]>("/stats/recurring", { asOf });
}
