// div 너비를 %로 채우는 방식. 축·툴팁·범례가 필요 없어 라이브러리를 쓰지 않는다 (CLAUDE.md 3장).

import { motion, useReducedMotion } from "motion/react";

export type BudgetBarDatum = { name: string; spent: number; budget: number; color?: string };

interface BudgetBarProps {
  data: BudgetBarDatum[];
}

export function BudgetBar({ data }: BudgetBarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => {
        // budget === 0 분기를 반드시 둔다 — 0으로 나누면 Infinity/NaN이 화면에 실린다 (CLAUDE.md 5장).
        const ratio = d.budget > 0 ? Math.min(d.spent / d.budget, 1) : 0;
        const exceeded = d.budget > 0 && d.spent > d.budget;

        return (
          <div key={d.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span>{d.name}</span>
              <span className={exceeded ? "text-expense font-medium" : "text-muted-foreground"}>
                {d.budget > 0 ? `${Math.round(ratio * 100)}%` : "예산 미설정"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              {/* 차트 막대는 200ms 상한의 예외로 300ms를 쓴다(CLAUDE.md 8장). */}
              <motion.div
                className="h-full rounded-full"
                initial={shouldReduceMotion ? false : { width: 0 }}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                style={{ backgroundColor: exceeded ? "var(--expense)" : (d.color ?? "var(--primary)") }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
