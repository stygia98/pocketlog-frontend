// CSS grid-cols-7 + 배경색 단계. Recharts에는 이런 차트가 없어 처음부터 직접 구현한다 (CLAUDE.md 3장).
// 배경 농도는 지출액 기준 4단계(파스텔)로 나눈다 — PRD STAT-03 "지출액에 따라 배경 농도 4단계".

import { getDate, getDay, parseISO } from "date-fns";

import { formatCompactAmount } from "@/lib/money";

export type MonthHeatmapDatum = { date: string; income: number; expense: number };

interface MonthHeatmapProps {
  data: MonthHeatmapDatum[];
  /** 날짜 칸을 선택했을 때 호출된다(yyyy-MM-dd). 내역 화면 필터 연결 등에 쓴다. */
  onSelectDate?: (date: string) => void;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 파스텔 4단계 — 최고 단계도 --expense 40%까지만 섞어 채도를 낮게 유지한다.
const INTENSITY_MIX_PERCENT = [15, 27, 40] as const;

function intensityTier(expense: number, max: number): number {
  if (expense <= 0) return 0;
  const ratio = expense / max;
  if (ratio <= 1 / 3) return 1;
  if (ratio <= 2 / 3) return 2;
  return 3;
}

export function MonthHeatmap({ data, onSelectDate }: MonthHeatmapProps) {
  const max = Math.max(1, ...data.map((d) => d.expense));
  // 1일이 무슨 요일인지에 맞춰 앞쪽을 빈 칸으로 채워 실제 달력처럼 정렬한다.
  const leadingBlanks = data.length > 0 ? getDay(parseISO(data[0].date)) : 0;

  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className="pb-1 text-center text-xs text-muted-foreground">
          {label}
        </div>
      ))}
      {Array.from({ length: leadingBlanks }).map((_, index) => (
        <div key={`blank-${index}`} aria-hidden />
      ))}
      {data.map((d) => {
        const tier = intensityTier(d.expense, max);
        return (
          <button
            key={d.date}
            type="button"
            onClick={() => onSelectDate?.(d.date)}
            title={`${d.date}: 수입 ${formatCompactAmount(d.income)} · 지출 ${formatCompactAmount(d.expense)}`}
            className="flex aspect-square flex-col gap-0.5 rounded-sm border border-border p-1 text-left transition-opacity hover:opacity-80"
            style={{
              backgroundColor:
                tier === 0 ? "var(--muted)" : `color-mix(in oklch, var(--expense) ${INTENSITY_MIX_PERCENT[tier - 1]}%, var(--muted))`,
            }}
          >
            <span className="text-[10px] leading-none text-muted-foreground">{getDate(parseISO(d.date))}</span>
            <span className="text-[9px] leading-tight" style={{ color: "var(--income)" }}>
              {formatCompactAmount(d.income)}
            </span>
            <span className="text-[9px] leading-tight" style={{ color: "var(--expense)" }}>
              {formatCompactAmount(d.expense)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
