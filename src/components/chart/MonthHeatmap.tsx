// CSS grid-cols-7 + 배경색 단계. Recharts에는 이런 차트가 없어 처음부터 직접 구현한다 (CLAUDE.md 3장).
// 배경 농도는 지출액 기준 4단계(파스텔)로 나눈다 — PRD STAT-03 "지출액에 따라 배경 농도 4단계".

import { getDate, getDay, parseISO } from "date-fns";
import { motion } from "motion/react";

import { formatCompactAmount } from "@/lib/money";

export type MonthHeatmapDatum = { date: string; income: number; expense: number };

interface MonthHeatmapProps {
  data: MonthHeatmapDatum[];
  /** 날짜 칸을 선택했을 때 호출된다(yyyy-MM-dd). 내역 화면 필터 연결 등에 쓴다. */
  onSelectDate?: (date: string) => void;
  /** 무지출 도장의 기준일(yyyy-MM-dd, 사용자의 "오늘"). 없으면 모든 무지출 날에 도장을 찍는다. */
  asOf?: string;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 파스텔 4단계(연두~초록). 활동이 없는 날(0원/0원)은 이 배열이 아니라 흰색으로 따로 처리한다.
const INTENSITY_COLORS = ["#F3F9EE", "#E0F0D6", "#CBE6BA", "#B2D99B"] as const;

function intensityTier(expense: number, max: number): number {
  if (expense <= 0) return 0;
  const ratio = expense / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function MonthHeatmap({ data, onSelectDate, asOf }: MonthHeatmapProps) {
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
        // 무지출 챌린지: 지출이 없었던 지난 날에만 도장을 찍는다. asOf가 없으면(호출부가 안 넘기면) 항상 표시한다.
        const isNoSpendDay = d.expense <= 0 && (!asOf || d.date <= asOf);
        return (
          <button
            key={d.date}
            type="button"
            onClick={() => onSelectDate?.(d.date)}
            aria-label={`${d.date}: 수입 ${formatCompactAmount(d.income)} · 지출 ${formatCompactAmount(d.expense)}${isNoSpendDay ? " · 무지출 달성" : ""}`}
            className="relative flex aspect-square cursor-pointer flex-col gap-0.5 rounded-sm border border-border p-1 text-left transition-opacity hover:opacity-80"
            style={{
              backgroundColor: tier === 0 ? "#ffffff" : INTENSITY_COLORS[tier - 1],
            }}
          >
            {isNoSpendDay && (
              // public/assets/no-spend-stamp.png는 원본(종이 질감 배경)에서 밝은 픽셀을 투명 처리해 둔
              // 도장 자국만 남긴 PNG다 — 어떤 셀 배경 위에도 자연스럽게 겹쳐진다.
              <motion.img
                src="/assets/no-spend-stamp.png"
                alt=""
                aria-hidden
                initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: -8 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute inset-0.5 size-[calc(100%-0.25rem)] object-contain"
              />
            )}
            <span className="relative z-10 text-[13px] font-semibold leading-none text-muted-foreground sm:text-lg">
              {getDate(parseISO(d.date))}
            </span>
            {/* 수입·지출이 0원인 줄은 아예 렌더링하지 않는다 — 매일 "0원"이 두 줄씩 반복되면
                실제 값이 있는 날이 눈에 띄지 않는다. 둘 다 0이면 날짜만 보인다. */}
            {d.income > 0 && (
              <span className="relative z-10 truncate text-[10px] font-medium leading-tight sm:text-[15px]" style={{ color: "var(--income)" }}>
                {formatCompactAmount(d.income)}
              </span>
            )}
            {d.expense > 0 && (
              <span className="relative z-10 truncate text-[10px] font-medium leading-tight sm:text-[15px]" style={{ color: "var(--expense)" }}>
                {formatCompactAmount(d.expense)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
