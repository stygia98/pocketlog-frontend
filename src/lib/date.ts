// 날짜 포맷은 이 파일만 쓴다. 화면에서 date-fns의 format을 직접 부르지 않는다 (CLAUDE.md 3장 · 10장).
//
// ⚠️ toISOString()을 쓰지 않는다. UTC로 변환되어 자정 근처(KST 0~9시)에 날짜가 하루 밀린다
// (CLAUDE.md 4장 "이번 달과 오늘을 서버가 판정하지 않는다"). 이 파일의 모든 함수는 로컬 타임존
// 기준으로 문자열을 만든다.

import { endOfWeek, format, parseISO, startOfWeek, subDays } from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";
const YEAR_MONTH_FORMAT = "yyyy-MM";

/** 사용자의 "오늘"을 yyyy-MM-dd로. asOf 파라미터에 그대로 쓴다. */
export function todayString(): string {
  return format(new Date(), DATE_FORMAT);
}

/** Date 객체를 txnDate/from/to 파라미터 형식(yyyy-MM-dd)으로 변환한다. */
export function toDateString(date: Date): string {
  return format(date, DATE_FORMAT);
}

/** Date 객체를 yearMonth 파라미터 형식(yyyy-MM)으로 변환한다. */
export function toYearMonthString(date: Date): string {
  return format(date, YEAR_MONTH_FORMAT);
}

/** yyyy-MM-dd 문자열을 화면 표시용(예: 2026-09-14)으로 그대로 포맷한다. */
export function formatDate(dateString: string): string {
  return format(parseISO(dateString), DATE_FORMAT);
}

/** yyyy-MM 문자열을 화면 표시용(예: 2026년 9월)으로 변환한다. 대시보드 월 선택 헤더에 쓴다. */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}년 ${Number(month)}월`;
}

/** 오늘로부터 n일 전 날짜를 yyyy-MM-dd로. 챗봇의 "어제"·"최근 N일" 파싱에 쓴다. */
export function daysAgoString(n: number): string {
  return toDateString(subDays(new Date(), n));
}

/** yyyy-MM 문자열의 1일~말일을 from/to 구간으로 변환한다. */
export function yearMonthToRange(yearMonth: string): { from: string; to: string } {
  const [year, month] = yearMonth.split("-").map(Number);
  return {
    from: toDateString(new Date(year, month - 1, 1)),
    to: toDateString(new Date(year, month, 0)), // 다음 달 0일째 = 이번 달 말일
  };
}

/** 이번 주(월요일 시작) 구간을 from/to로 반환한다. */
export function thisWeekRange(): { from: string; to: string } {
  const today = new Date();
  return {
    from: toDateString(startOfWeek(today, { weekStartsOn: 1 })),
    to: toDateString(endOfWeek(today, { weekStartsOn: 1 })),
  };
}

/** 지난 주(월요일 시작) 구간을 from/to로 반환한다. */
export function lastWeekRange(): { from: string; to: string } {
  const lastWeekDay = subDays(new Date(), 7);
  return {
    from: toDateString(startOfWeek(lastWeekDay, { weekStartsOn: 1 })),
    to: toDateString(endOfWeek(lastWeekDay, { weekStartsOn: 1 })),
  };
}
