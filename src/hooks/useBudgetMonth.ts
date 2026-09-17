"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, format, parse, subMonths } from "date-fns";

import { toYearMonthString } from "@/lib/date";

const YEAR_MONTH_FORMAT = "yyyy-MM";

// 조회 대상 월(?yearMonth=)을 URL 쿼리로 관리한다. 예산은 다음 달 예산을 미리 설정해 두는
// 사용도 자연스러우므로 대시보드(useDashboardMonth)와 달리 미래 달 이동을 막지 않는다.
export function useBudgetMonth() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const yearMonth = searchParams.get("yearMonth") ?? toYearMonthString(new Date());

  const setMonth = (nextYearMonth: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("yearMonth", nextYearMonth);
    router.push(`${pathname}?${params.toString()}`);
  };

  const shift = (delta: number) => {
    const date = parse(yearMonth, YEAR_MONTH_FORMAT, new Date());
    const shifted = delta > 0 ? addMonths(date, delta) : subMonths(date, Math.abs(delta));
    setMonth(format(shifted, YEAR_MONTH_FORMAT));
  };

  return { yearMonth, goPrev: () => shift(-1), goNext: () => shift(1) };
}
