// div 너비를 %로 채우는 방식. 축·툴팁·범례가 필요 없어 라이브러리를 쓰지 않는다 (CLAUDE.md 3장).

import { motion, useReducedMotion } from "motion/react";

export type BudgetBarDatum = { name: string; spent: number; budget: number; color?: string };

interface BudgetBarProps {
  data: BudgetBarDatum[];
}

export function BudgetBar({ data }: BudgetBarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    // flex-1 + justify-between: 부모 카드가 옆 카드 높이에 맞춰 늘어나면 행들이 그 높이를 고르게 채운다.
    <div className="flex flex-1 flex-col justify-between gap-3">
      {data.map((d) => {
        // budget === 0 분기를 반드시 둔다 — 0으로 나누면 Infinity/NaN이 화면에 실린다 (CLAUDE.md 5장).
        const ratio = d.budget > 0 ? Math.min(d.spent / d.budget, 1) : 0;
        const exceeded = d.budget > 0 && d.spent > d.budget;

        return (
          <div key={d.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              {/* 이름 옆 점은 도넛 범례와 같은 모양이다. 막대는 예산 이내면 카테고리 색, 초과하면 빨강이다. */}
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: d.color ?? "var(--muted-foreground)" }}
                  aria-hidden
                />
                <span className="truncate">{d.name}</span>
              </span>
              <span className={exceeded ? "shrink-0 text-destructive font-medium" : "shrink-0 text-muted-foreground"}>
                {d.budget > 0 ? `${Math.round(ratio * 100)}%` : "예산 미설정"}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              {...(d.budget > 0
                ? {
                    role: "progressbar",
                    "aria-label": `${d.name} 예산 소진율`,
                    "aria-valuemin": 0,
                    "aria-valuemax": 100,
                    "aria-valuenow": Math.round(ratio * 100),
                  }
                : {})}
            >
              {/* 차트 막대는 200ms 상한의 예외로 300ms를 쓴다(CLAUDE.md 8장). */}
              <motion.div
                className="h-full rounded-full"
                initial={shouldReduceMotion ? false : { width: 0 }}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                style={{ backgroundColor: exceeded ? "var(--destructive)" : (d.color ?? "var(--primary)") }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
