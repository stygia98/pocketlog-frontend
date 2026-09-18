import { computeNoSpendStreak } from "@/lib/noSpendStreak";
import type { DailyStat } from "@/types/stats";

interface NoSpendStreakCardProps {
  daily: DailyStat[];
  asOf: string;
  /** 과거 달을 보고 있으면 카드 자체를 숨긴다 — "현재 N일째"·"이번 주 목표"는 오늘 기준이라 지난 달엔 의미가 없다. */
  isPastMonth: boolean;
}

export function NoSpendStreakCard({ daily, asOf, isPastMonth }: NoSpendStreakCardProps) {
  if (isPastMonth) return null;

  const { longestStreak, currentStreak, weeklyAchieved, weeklyGoal } = computeNoSpendStreak(daily, asOf);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">무지출 스트릭</p>

      <div className="mt-1 flex items-baseline justify-between">
        <p className="text-lg font-semibold tabular-nums">이번 달 최장 {longestStreak}일 연속</p>
        {currentStreak > 0 && (
          <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>
            현재 {currentStreak}일째
          </p>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>이번 주 목표</span>
          <span className="tabular-nums">
            {weeklyAchieved}/{weeklyGoal}일
          </span>
        </div>
        <div className="mt-1.5 flex gap-1">
          {Array.from({ length: Math.max(weeklyGoal, weeklyAchieved) }).map((_, index) => (
            <div
              key={index}
              className="h-1.5 flex-1 rounded-full"
              style={{ backgroundColor: index < weeklyAchieved ? "var(--primary)" : "var(--border)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
