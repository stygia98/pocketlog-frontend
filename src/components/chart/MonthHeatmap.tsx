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

// 파스텔 4단계(스카이블루). 활동이 없는 날(0원/0원)은 이 배열이 아니라 흰색으로 따로 처리한다.
const INTENSITY_COLORS = ["#EFF6FF", "#D6E9FF", "#B3D7FF", "#8AC0FF"] as const;

function intensityTier(expense: number, max: number): number {
  if (expense <= 0) return 0;
  const ratio = expense / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
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
            aria-label={`${d.date}: 수입 ${formatCompactAmount(d.income)} · 지출 ${formatCompactAmount(d.expense)}`}
            className="flex aspect-square cursor-pointer flex-col gap-0.5 rounded-sm border border-border p-1 text-left transition-opacity hover:opacity-80"
            style={{
              backgroundColor: tier === 0 ? "#ffffff" : INTENSITY_COLORS[tier - 1],
            }}
          >
            <span className="text-[11px] font-semibold leading-none text-muted-foreground sm:text-lg">{getDate(parseISO(d.date))}</span>
            <span className="truncate text-[9px] font-bold leading-tight sm:text-[15px]" style={{ color: "var(--income)" }}>
              {formatCompactAmount(d.income)}
            </span>
            <span className="truncate text-[9px] font-bold leading-tight sm:text-[15px]" style={{ color: "var(--expense)" }}>
              {formatCompactAmount(d.expense)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
