// 가로 막대. 큰 금액부터 정렬하고 가장 큰 항목을 100%로 잡아 항목 간 차이가 눈에 띄게 한다.
// div 너비를 %로 채우는 방식이라 라이브러리를 쓰지 않는다 (CLAUDE.md 3장).

import { motion, useReducedMotion } from "motion/react";

import { formatAmount } from "@/lib/money";
import { PALETTE, type ChartDatum } from "@/components/chart/CategoryDonut";

export function CategoryBar({ data }: { data: ChartDatum[] }) {
  const shouldReduceMotion = useReducedMotion();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  // 색 배정은 입력 순서 기준이라, 정렬하기 전에 색을 먼저 정해 도넛·트리맵과 같은 색이 나오게 한다.
  const rows = data
    .map((d, index) => ({ ...d, color: d.color ?? PALETTE[index % PALETTE.length] }))
    .sort((a, b) => b.value - a.value);
  const max = rows[0]?.value ?? 0;

  if (total <= 0) return <p className="text-sm text-muted-foreground">데이터 없음</p>;

  return (
    <ul className="flex w-full min-w-0 flex-col gap-4" aria-label="카테고리별 지출 막대 그래프">
      {rows.map((d) => (
        <li key={d.name} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatAmount(d.value)} · {Math.round((d.value / total) * 100)}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            {/* 차트 막대는 200ms 상한의 예외로 300ms를 쓴다(CLAUDE.md 8장). */}
            <motion.div
              className="h-full rounded-full"
              initial={shouldReduceMotion ? false : { width: 0 }}
              animate={{ width: `${max > 0 ? (d.value / max) * 100 : 0}%` }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              style={{ backgroundColor: d.color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
