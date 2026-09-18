"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";

import { AnomalyCard } from "@/components/dashboard/AnomalyCard";
import { BudgetUsage } from "@/components/dashboard/BudgetUsage";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { DailyHeatmap } from "@/components/dashboard/DailyHeatmap";
import { ForecastCard } from "@/components/dashboard/ForecastCard";
import { NoSpendStreakCard } from "@/components/dashboard/NoSpendStreakCard";
import { RecurringCard } from "@/components/dashboard/RecurringCard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { CardSkeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { MonthNavigator } from "@/components/common/MonthNavigator";
import { useDashboardMonth } from "@/hooks/useDashboardMonth";
import { useMonthlyStatsQuery } from "@/hooks/useStats";
import { todayString } from "@/lib/date";

function DashboardPageContent() {
  const router = useRouter();
  const { yearMonth, goPrev, goNext, canGoNext } = useDashboardMonth();
  // 서버는 UTC로 돌고 사용자는 KST라, "오늘"은 서버가 아니라 클라이언트가 계산해 보낸다(CLAUDE.md 4장).
  const asOf = todayString();
  const statsQuery = useMonthlyStatsQuery(yearMonth, asOf);

  if (statsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <MonthNavigator yearMonth={yearMonth} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (statsQuery.isError) {
    return (
      <div className="flex flex-col gap-6">
        <MonthNavigator yearMonth={yearMonth} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
        <ErrorState onRetry={() => statsQuery.refetch()} />
      </div>
    );
  }

  const stats = statsQuery.data;
  if (!stats) return null;

  // 과거 달을 보고 있으면 예측 카드를 숨긴다 — 이미 끝난 달의 "예상"은 의미가 없다(CLAUDE.md 5장).
  const isPastMonth = yearMonth < todayString().slice(0, 7);
  const hasNoActivity = stats.summary.income === 0 && stats.summary.expense === 0;

  return (
    <div className="flex flex-col gap-6">
      <MonthNavigator yearMonth={yearMonth} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />

      <SummaryCards summary={stats.summary} />

      <DailyHeatmap
        daily={stats.daily}
        onSelectDate={(date) => router.push(`/transactions?from=${date}&to=${date}`)}
        asOf={asOf}
      />

      <NoSpendStreakCard daily={stats.daily} asOf={asOf} isPastMonth={isPastMonth} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ForecastCard forecast={stats.forecast} isPastMonth={isPastMonth} />
        <RecurringCard asOf={asOf} />
      </div>

      <AnomalyCard anomalies={stats.anomalies} />

      {hasNoActivity && (
        <p className="text-center text-sm text-muted-foreground">이 달에는 기록이 없어요</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryBreakdown byCategory={stats.byCategory} />
        <BudgetUsage budgets={stats.budgets} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // useDashboardMonth 내부의 useSearchParams 때문에 Suspense로 감싸야 빌드가 통과한다(Next15).
  return (
    <Suspense fallback={<CardSkeleton count={3} />}>
      <DashboardPageContent />
    </Suspense>
  );
}
