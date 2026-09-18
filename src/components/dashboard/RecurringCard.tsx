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
              <li key={`${item.merchant}-${item.categoryId}`} className="text-sm">
                {/*
                  상호명 칸을 고정폭(sm 이상)으로 둬야 옆 칸("N개월 연속 · 날짜")의 시작 위치가
                  상호명 글자 수와 무관하게 줄마다 가지런히 맞는다. 다만 이 카드는 폭이 좁아
                  (대시보드 2열 그리드) sm 미만에서 셋을 한 줄에 다 넣으면 날짜가 잘린다
                  ("3개월 연속 · 202...") — sm 미만에서는 상호명을 한 줄, 날짜·금액을 그 아래
                  한 줄로 나눈다.
                */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="truncate font-medium sm:w-28 sm:shrink-0">{item.merchant}</span>
                  <span className="flex items-center justify-between gap-3 sm:contents">
                    <span className="text-muted-foreground sm:flex-1 sm:truncate">
                      {item.monthsSeen}개월 연속 · {formatDate(item.lastDate)}
                    </span>
                    <span className="shrink-0 tabular-nums">{formatAmount(item.medianAmount)}</span>
                  </span>
                </div>
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
