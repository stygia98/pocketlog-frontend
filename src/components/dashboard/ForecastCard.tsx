import { formatAmount } from "@/lib/money";
import type { Forecast } from "@/types/stats";

interface ForecastCardProps {
  forecast: Forecast | null;
  /** 과거 달을 보고 있으면 카드 자체를 숨긴다 — 끝난 달의 "예상"은 의미가 없다. */
  isPastMonth: boolean;
}

// STAT-04, STAT-07. 서버 값을 그대로 표시한다 — 프론트에서 예측을 다시 계산하지 않는다.
export function ForecastCard({ forecast, isPastMonth }: ForecastCardProps) {
  if (isPastMonth) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">이번 달 예상 지출</p>
      {forecast === null ? (
        <p className="mt-1 text-base">예측하려면 데이터가 조금 더 필요해요</p>
      ) : (
        <>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            이번 달 이 속도면 {formatAmount(forecast.projectedExpense)}원을 쓰게 돼요
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {forecast.daysElapsed}일 경과 · 최근 {forecast.basisMonths}개월 기준
          </p>
        </>
      )}
    </div>
  );
}
