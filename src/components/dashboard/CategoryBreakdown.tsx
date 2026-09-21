import { CategoryDonut } from "@/components/chart/CategoryDonut";
import { formatAmount } from "@/lib/money";
import type { CategoryStat } from "@/types/stats";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface CategoryBreakdownProps {
  byCategory: CategoryStat[];
}

// STAT-02. CategoryDonut(components/chart)은 수정하지 않고 실제 데이터를 그 props 모양으로 바꾼다.
export function CategoryBreakdown({ byCategory }: CategoryBreakdownProps) {
  if (byCategory.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">카테고리별 지출</p>
        <p className="mt-2 text-sm">이 달에는 지출이 없어요</p>
      </div>
    );
  }

  const donutData = byCategory.map((category) => ({
    name: category.name,
    value: category.amount,
    color: HEX_COLOR_PATTERN.test(category.color) ? category.color : undefined,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">카테고리별 지출</p>
      {/* 도넛을 가운데(190px)에 두고, 목록은 그 아래 전체 폭으로 둔다. */}
      <div className="mt-3 flex flex-col items-center gap-5">
        <CategoryDonut data={donutData} size={190} strokeWidth={28} />
        <ul className="flex w-full min-w-0 flex-col gap-2.5">
          {byCategory.map((category) => (
            <li key={category.categoryId} className="flex items-center justify-between gap-2 text-sm">
              {/* 이름 텍스트는 색 위가 아니라 점 옆에 둔다 — 사용자 지정 색이라 대비를 계산할 수 없다(PRD.md 5.1). */}
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: HEX_COLOR_PATTERN.test(category.color)
                      ? category.color
                      : "var(--muted-foreground)",
                  }}
                  aria-hidden
                />
                <span className="truncate">
                  {category.name}
                  {category.deleted && <span className="text-muted-foreground"> (삭제됨)</span>}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatAmount(category.amount)} · {Math.round(category.ratio * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
