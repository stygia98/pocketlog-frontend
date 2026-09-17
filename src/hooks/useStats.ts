"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMonthlyStats, fetchRecurring } from "@/lib/stats";
import { queryKeys } from "@/lib/queryKeys";

export function useMonthlyStatsQuery(yearMonth: string, asOf: string) {
  return useQuery({
    queryKey: queryKeys.stats.monthly({ yearMonth, asOf }),
    queryFn: () => fetchMonthlyStats(yearMonth, asOf),
  });
}

export function useRecurringQuery(asOf: string) {
  return useQuery({
    queryKey: queryKeys.stats.recurring({ asOf }),
    queryFn: () => fetchRecurring(asOf),
  });
}
