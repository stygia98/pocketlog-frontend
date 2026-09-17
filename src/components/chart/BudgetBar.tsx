// div 너비를 %로 채우는 방식. 축·툴팁·범례가 필요 없어 라이브러리를 쓰지 않는다 (CLAUDE.md 3장).

export type BudgetBarDatum = { name: string; spent: number; budget: number; color?: string };

interface BudgetBarProps {
  data: BudgetBarDatum[];
}

export function BudgetBar({ data }: BudgetBarProps) {
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
              <div
                className="h-full rounded-full"
                style={{
                  width: `${ratio * 100}%`,
                  backgroundColor: exceeded ? "var(--expense)" : (d.color ?? "var(--primary)"),
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
