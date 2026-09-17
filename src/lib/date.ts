// 날짜 포맷은 이 파일만 쓴다. 화면에서 date-fns의 format을 직접 부르지 않는다 (CLAUDE.md 3장 · 10장).
//
// ⚠️ toISOString()을 쓰지 않는다. UTC로 변환되어 자정 근처(KST 0~9시)에 날짜가 하루 밀린다
// (CLAUDE.md 4장 "이번 달과 오늘을 서버가 판정하지 않는다"). 이 파일의 모든 함수는 로컬 타임존
// 기준으로 문자열을 만든다.

import { format, parseISO } from "date-fns";

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

/** createdAt/updatedAt처럼 서버가 ISO-8601 UTC 문자열로 내려준 값을 화면 표시용으로 변환한다. */
export function formatDateTime(isoUtc: string): string {
  return format(parseISO(isoUtc), "yyyy-MM-dd HH:mm");
}

/** yyyy-MM-dd 문자열을 화면 표시용(예: 2026-09-14)으로 그대로 포맷한다. */
export function formatDate(dateString: string): string {
  return format(parseISO(dateString), DATE_FORMAT);
}
