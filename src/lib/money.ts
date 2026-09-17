// 금액 포맷/파싱은 이 두 함수만 쓴다. 화면에서 toLocaleString을 직접 부르지 않는다 (CLAUDE.md 3장 · 10장).

/** 입력값에서 숫자가 아닌 문자를 제거해 콤마 없는 원본 문자열을 반환한다. dirty 판정·서버 전송은 이 값을 쓴다. */
export function parseAmount(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/**
 * 화면 표시용 천단위 콤마 포맷. 원화는 소수점을 쓰지 않으므로 API가 내려주는 12500.00 같은
 * 값도 정수로 표시한다(maximumFractionDigits: 0).
 */
export function formatAmount(value: number | string): string {
  const numeric = typeof value === "number" ? value : Number(parseAmount(value));
  if (!Number.isFinite(numeric)) return "";
  return numeric.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

/**
 * 히트맵처럼 좁은 칸에 넣는 압축 표시용. 0이면 "0원", 만원 미만이면 그대로,
 * 그 이상이면 "5.5만"처럼 만 단위 소수 첫째 자리로 줄인다(정수면 소수점을 생략).
 */
export function formatCompactAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0원";
  if (value < 10000) return `${formatAmount(value)}원`;
  const man = Math.round((value / 10000) * 10) / 10;
  return `${Number.isInteger(man) ? man.toFixed(0) : man.toFixed(1)}만`;
}
