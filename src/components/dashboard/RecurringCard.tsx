"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useRecurringQuery } from "@/hooks/useStats";
import { formatDate } from "@/lib/date";
import { formatAmount } from "@/lib/money";

interface RecurringCardProps {
  asOf: string;
}

// STAT-06. /stats/recurring은 최근 3개월을 스캔해 비용이 커 별도 API로 분리되어 있다(CLAUDE.md 5장).
// 그래서 이 카드만 예외적으로 스스로 데이터를 페칭해 본문 로딩과 분리된 스켈레톤을 갖는다.
export function RecurringCard({ asOf }: RecurringCardProps) {
  const { data, isLoading } = useRecurringQuery(asOf);

  if (isLoading) {
    // 로드 후 카드와 대략 같은 높이를 미리 차지해 레이아웃이 밀리지 않게 한다(UX-01).
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-24" />
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
        <Skeleton className="mt-3 h-5 w-32" />
      </div>
    );
  }

  const items = data ?? [];
  const total = items.reduce((sum, item) => sum + item.medianAmount, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">고정지출로 보여요</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm">찾아낸 고정지출이 없어요</p>
      ) : (
        <>
          <ul className="mt-2 flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={`${item.merchant}-${item.categoryId}`}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm"
              >
                <span className="font-medium">{item.merchant}</span>
                <span className="text-muted-foreground">
                  {item.monthsSeen}개월 연속 · {formatDate(item.lastDate)}
                </span>
                <span className="tabular-nums">{formatAmount(item.medianAmount)}</span>
              </li>
            ))}
          </ul>
          {/* PRD.md 4.5 — "합계가 매달 빠져나간다는 사실을 등록 없이 확인"이 이 카드의 요점이다. */}
          <p className="mt-3 border-t border-border pt-2 text-sm font-medium tabular-nums">
            월 합계 {formatAmount(total)}
          </p>
        </>
      )}
    </div>
  );
}
