// MonthHeatmap의 무지출 도장과 같은 기준(expense <= 0 && 오늘 이전)으로 daily를 재집계한다.
// 백엔드 변경 없이 이미 받아온 stats.daily로 클라이언트에서 계산한다.

import { endOfWeek, parseISO, startOfWeek } from "date-fns";

import type { DailyStat } from "@/types/stats";

export interface NoSpendStreakStats {
  /** 이번 달 안에서 가장 길게 이어진 무지출 연속일 */
  longestStreak: number;
  /** 오늘까지 끊기지 않고 이어지는 중인 연속일 (0이면 어제 또는 오늘 지출이 있었다는 뜻) */
  currentStreak: number;
  weeklyAchieved: number;
  weeklyGoal: number;
}

const WEEKLY_GOAL = 3;

export function computeNoSpendStreak(daily: DailyStat[], asOf: string): NoSpendStreakStats {
  const pastDays = daily.filter((d) => d.date <= asOf);

  let longestStreak = 0;
  let running = 0;
  for (const d of pastDays) {
    running = d.expense <= 0 ? running + 1 : 0;
    longestStreak = Math.max(longestStreak, running);
  }

  let currentStreak = 0;
  for (let i = pastDays.length - 1; i >= 0 && pastDays[i].expense <= 0; i--) {
    currentStreak += 1;
  }

  const asOfDate = parseISO(asOf);
  const weekStart = startOfWeek(asOfDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(asOfDate, { weekStartsOn: 0 });
  const weeklyAchieved = pastDays.filter((d) => {
    if (d.expense > 0) return false;
    const date = parseISO(d.date);
    return date >= weekStart && date <= weekEnd;
  }).length;

  return { longestStreak, currentStreak, weeklyAchieved, weeklyGoal: WEEKLY_GOAL };
}
