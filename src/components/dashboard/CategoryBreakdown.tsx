"use client";

import { useState } from "react";

import { CategoryBar } from "@/components/chart/CategoryBar";
import { CategoryDonut } from "@/components/chart/CategoryDonut";
import { CategoryTreemap } from "@/components/chart/CategoryTreemap";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAmount } from "@/lib/money";
import type { CategoryStat } from "@/types/stats";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface CategoryBreakdownProps {
  byCategory: CategoryStat[];
}

type ChartKind = "donut" | "bar" | "treemap";

// STAT-02. 세 차트(components/chart)는 같은 ChartDatum 모양을 받으므로, 실제 데이터를 그 모양으로 한 번만 바꿔 넘긴다.
export function CategoryBreakdown({ byCategory }: CategoryBreakdownProps) {
  const [kind, setKind] = useState<ChartKind>("donut");

  if (byCategory.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">카테고리별 지출</p>
        <p className="mt-2 text-sm">이 달에는 지출이 없어요</p>
      </div>
    );
  }

  const chartData = byCategory.map((category) => ({
    name: category.deleted ? `${category.name} (삭제됨)` : category.name,
    value: category.amount,
    color: HEX_COLOR_PATTERN.test(category.color) ? category.color : undefined,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">카테고리별 지출</p>
        <Tabs value={kind} onValueChange={(value) => setKind(value as ChartKind)}>
          <TabsList aria-label="차트 종류">
            <TabsTrigger value="donut" className="px-3">
              원형
            </TabsTrigger>
            <TabsTrigger value="bar" className="px-3">
              막대
            </TabsTrigger>
            <TabsTrigger value="treemap" className="px-3">
              트리맵
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {/* 도넛·트리맵은 그 아래 전체 폭 목록에서 정확한 금액을 보여준다. 막대는 이름·금액·비율을 이미 담고 있어 목록이 없다. */}
      <div className="mt-3 flex flex-col items-center gap-5">
        {kind === "donut" && <CategoryDonut data={chartData} size={190} strokeWidth={28} />}
        {kind === "treemap" && <CategoryTreemap data={chartData} />}
        {kind === "bar" && <CategoryBar data={chartData} />}
        {kind !== "bar" && (
          <ul className="flex w-full min-w-0 flex-col gap-3">
            {byCategory.map((category) => (
              <li key={category.categoryId} className="flex items-center justify-between gap-2 text-sm">
                {/* 이름 텍스트는 색 위가 아니라 점 옆에 둔다 — 사용자 지정 색이라 대비를 계산할 수 없다(PRD.md 5.1). */}
                <span className="flex min-w-0 items-center gap-2">
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
        )}
      </div>
    </div>
  );
}
