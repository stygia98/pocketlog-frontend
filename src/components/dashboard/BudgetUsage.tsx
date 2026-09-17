"use client";

import { BudgetBar } from "@/components/chart/BudgetBar";
import { useCategoriesQuery } from "@/hooks/useCategories";
import type { BudgetStat } from "@/types/stats";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface BudgetUsageProps {
  budgets: BudgetStat[];
}

// BUD-03, BUD-04. BudgetBar(components/chart)는 수정하지 않는다 — budget===0 분기와 초과 시
// 빨강 처리를 Phase7에서 이미 구현해 뒀다. 여기서는 실제 데이터만 그 모양으로 바꾼다.
//
// BudgetStat(stats.budgets)엔 color가 없다 — 집계 응답이라 카테고리 원본을 들고 있지 않다.
// CategoryBreakdown의 도넛과 같은 색으로 보이도록 카테고리 목록에서 색을 가져와 맞춘다.
export function BudgetUsage({ budgets }: BudgetUsageProps) {
  const categoriesQuery = useCategoriesQuery();

  if (budgets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">예산 소진율</p>
        <p className="mt-2 text-sm">설정된 예산이 없어요</p>
      </div>
    );
  }

  // 인라인 스타일에 넣기 전 정규식으로 검증한다(PRD.md 5.1) — CategoryBreakdown과 동일한 방어.
  const colorByCategoryId = new Map(
    (categoriesQuery.data ?? [])
      .filter((category) => HEX_COLOR_PATTERN.test(category.color))
      .map((category) => [category.id, category.color]),
  );

  const data = budgets.map((budget) => ({
    name: budget.name,
    spent: budget.spent,
    budget: budget.budget,
    color: colorByCategoryId.get(budget.categoryId),
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">예산 소진율</p>
      <div className="mt-3">
        <BudgetBar data={data} />
      </div>
    </div>
  );
}
