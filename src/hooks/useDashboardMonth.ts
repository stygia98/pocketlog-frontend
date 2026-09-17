"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, format, parse, subMonths } from "date-fns";

import { toYearMonthString } from "@/lib/date";

const YEAR_MONTH_FORMAT = "yyyy-MM";

// 조회 대상 월(?ym=)을 URL 쿼리로 관리한다. push를 쓴다(replace 아님) — 뒤로가기로 이전 달을
// 복원할 수 있어야 한다(ROADMAP.md Phase 10 DoD).
export function useDashboardMonth() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentMonth = toYearMonthString(new Date());
  const yearMonth = searchParams.get("ym") ?? currentMonth;

  const setMonth = (nextYearMonth: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ym", nextYearMonth);
    router.push(`${pathname}?${params.toString()}`);
  };

  const shift = (delta: number) => {
    const date = parse(yearMonth, YEAR_MONTH_FORMAT, new Date());
    const shifted = delta > 0 ? addMonths(date, delta) : subMonths(date, Math.abs(delta));
    setMonth(format(shifted, YEAR_MONTH_FORMAT));
  };

  const goPrev = () => shift(-1);
  const goNext = () => shift(1);
  // 미래 달로는 이동할 수 없다 — 이번 달이 상한이다(PRD.md 5.4).
  const canGoNext = yearMonth < currentMonth;

  return { yearMonth, goPrev, goNext, canGoNext };
}
