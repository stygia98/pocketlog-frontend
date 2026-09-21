import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatYearMonth } from "@/lib/date";

interface MonthNavigatorProps {
  yearMonth: string;
  onPrev: () => void;
  onNext: () => void;
  /** 대시보드만 미래 달 이동을 막는다(PRD.md 5.4). 예산 화면 등은 생략하면 항상 이동 가능하다. */
  canGoNext?: boolean;
}

// 뒤로가기로 이전 달로 돌아가야 하므로 월 이동은 호출부(useDashboardMonth 등)가 router.push로 처리한다.
// 이 컴포넌트는 그 결과(yearMonth)를 표시하고 버튼 클릭을 그대로 전달하기만 한다.
export function MonthNavigator({ yearMonth, onPrev, onNext, canGoNext = true }: MonthNavigatorProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <Button variant="outline" size="icon" onClick={onPrev} aria-label="이전 달">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <p aria-live="polite" className="min-w-28 text-center text-lg font-semibold">{formatYearMonth(yearMonth)}</p>
      <Button variant="outline" size="icon" onClick={onNext} disabled={!canGoNext} aria-label="다음 달">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
