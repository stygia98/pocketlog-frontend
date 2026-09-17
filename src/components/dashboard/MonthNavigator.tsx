import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatYearMonth } from "@/lib/date";

interface MonthNavigatorProps {
  yearMonth: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}

// 뒤로가기로 이전 달로 돌아가야 하므로 월 이동은 useDashboardMonth가 router.push로 처리한다.
// 이 컴포넌트는 그 결과(yearMonth)를 표시하고 버튼 클릭을 그대로 전달하기만 한다.
export function MonthNavigator({ yearMonth, onPrev, onNext, canGoNext }: MonthNavigatorProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <Button variant="outline" size="icon" onClick={onPrev} aria-label="이전 달">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <p className="min-w-28 text-center text-lg font-semibold">{formatYearMonth(yearMonth)}</p>
      {/* 미래 달로는 이동할 수 없다(PRD.md 5.4) — 이번 달일 때 버튼을 비활성화한다. */}
      <Button variant="outline" size="icon" onClick={onNext} disabled={!canGoNext} aria-label="다음 달">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
