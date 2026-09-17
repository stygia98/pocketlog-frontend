// CSS grid-cols-7 + 배경색 단계. Recharts에는 이런 차트가 없어 처음부터 직접 구현한다 (CLAUDE.md 3장).

import { getDate, getDay, parseISO } from "date-fns";

import { formatAmount } from "@/lib/money";

export type MonthHeatmapDatum = { date: string; value: number };

interface MonthHeatmapProps {
  data: MonthHeatmapDatum[];
}

export function MonthHeatmap({ data }: MonthHeatmapProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  // 1일이 무슨 요일인지에 맞춰 앞쪽을 빈 칸으로 채워 실제 달력처럼 정렬한다.
  const leadingBlanks = data.length > 0 ? getDay(parseISO(data[0].date)) : 0;

  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: leadingBlanks }).map((_, index) => (
        <div key={`blank-${index}`} aria-hidden />
      ))}
      {data.map((d) => {
        const intensity = d.value <= 0 ? 0 : d.value / max;
        return (
          <div
            key={d.date}
            title={`${d.date}: ${formatAmount(d.value)}원`}
            className="relative aspect-square rounded-sm border border-border"
            style={{
              backgroundColor:
                intensity === 0
                  ? "var(--muted)"
                  : `color-mix(in oklch, var(--expense) ${Math.round(intensity * 100)}%, var(--muted))`,
            }}
          >
            {/* 배경 농도가 칸마다 달라 고정 색으로는 대비가 깨진다 — mix-blend-mode로 배경과 무관하게 대비를 유지한다. */}
            <span
              className="absolute left-0.5 top-0 text-[10px] leading-none"
              style={{ color: "white", mixBlendMode: "difference" }}
            >
              {getDate(parseISO(d.date))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
