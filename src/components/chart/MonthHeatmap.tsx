// CSS grid-cols-7 + 배경색 단계. Recharts에는 이런 차트가 없어 처음부터 직접 구현한다 (CLAUDE.md 3장).
// 배경 농도는 지출액 기준 4단계(파스텔)로 나눈다 — PRD STAT-03 "지출액에 따라 배경 농도 4단계".

import { getDate, getDay, parseISO, subDays } from "date-fns";
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
const INTENSITY_COLORS = ["#F3F9EE", "#E6F3DD", "#D6ECC8", "#C8E4B4"] as const;

// 셀 배경은 다크 모드에서도 밝은 색이라 글자색은 테마 토큰(--income 등)이 아니라 고정 진한 색을 쓴다.
// 가장 진한 4단계 배경 위에서도 WCAG AA(4.5:1)를 넘는 값이다.
const INK = { date: "#3F3E3A", income: "#166C40", expense: "#4B4A45" } as const;

function intensityTier(expense: number, max: number): number {
  if (expense <= 0) return 0;
  const ratio = expense / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// 이전·다음 달 날짜 칸. 데이터가 없는 자리를 채워 달력 모양을 맞추기만 하므로 옅게 보이고 누를 수 없다.
function OutsideDay({ day }: { day: number }) {
  return (
    <div aria-hidden className="aspect-square rounded-sm border border-border bg-white p-1 opacity-40">
      <span className="text-[13px] font-semibold leading-none sm:text-lg" style={{ color: INK.date }}>
        {day}
      </span>
    </div>
  );
}

export function MonthHeatmap({ data, onSelectDate, asOf }: MonthHeatmapProps) {
  const max = Math.max(1, ...data.map((d) => d.expense));
  // 1일이 무슨 요일인지에 맞춰 앞쪽을 이전 달 날짜로, 마지막 주의 남는 칸을 다음 달 날짜로 채워 실제 달력처럼 정렬한다.
  const leadingBlanks = data.length > 0 ? getDay(parseISO(data[0].date)) : 0;
  const prevMonthLastDay = data.length > 0 ? getDate(subDays(parseISO(data[0].date), 1)) : 0;
  const trailingBlanks = (7 - ((leadingBlanks + data.length) % 7)) % 7;

  return (
    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className="pb-1 text-center text-xs text-muted-foreground">
          {label}
        </div>
      ))}
      {Array.from({ length: leadingBlanks }).map((_, index) => (
        <OutsideDay key={`prev-${index}`} day={prevMonthLastDay - leadingBlanks + 1 + index} />
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
              // 원본(no-spend-stamp.png, 1.1MB·종이 질감 배경)에서 밝은 픽셀을 투명 처리한 도장 자국만 320px WebP(37KB)로 줄여 쓴다.
              // 무지출 날마다 한 장씩 그려지므로 원본을 그대로 쓰면 대시보드가 느려진다. 어떤 셀 배경 위에도 자연스럽게 겹쳐진다.
              <motion.img
                src="/assets/no-spend-stamp-sm.webp"
                alt=""
                aria-hidden
                decoding="async"
                initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: -8 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute inset-0.5 size-[calc(100%-0.25rem)] object-contain"
              />
            )}
            <span className="relative z-10 text-[13px] font-semibold leading-none sm:text-lg" style={{ color: INK.date }}>
              {getDate(parseISO(d.date))}
            </span>
            {/* 수입·지출이 0원인 줄은 아예 렌더링하지 않는다 — 매일 "0원"이 두 줄씩 반복되면
                실제 값이 있는 날이 눈에 띄지 않는다. 둘 다 0이면 날짜만 보인다. */}
            {d.income > 0 && (
              <span className="relative z-10 truncate text-[10px] font-medium leading-tight sm:text-[15px]" style={{ color: INK.income }}>
                {formatCompactAmount(d.income)}
              </span>
            )}
            {d.expense > 0 && (
              <span className="relative z-10 truncate text-[10px] font-medium leading-tight sm:text-[15px]" style={{ color: INK.expense }}>
                {formatCompactAmount(d.expense)}
              </span>
            )}
          </button>
        );
      })}
      {Array.from({ length: trailingBlanks }).map((_, index) => (
        <OutsideDay key={`next-${index}`} day={index + 1} />
      ))}
    </div>
  );
}
