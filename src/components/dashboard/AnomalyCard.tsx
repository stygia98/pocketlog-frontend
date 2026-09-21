"use client";

import { useCategoriesQuery } from "@/hooks/useCategories";
import type { Anomaly } from "@/types/stats";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface AnomalyCardProps {
  anomalies: Anomaly[];
}

// STAT-05. 빈 배열이면 카드 자체를 렌더하지 않는다 — 빈 카드가 남으면 안 된다.
// Anomaly엔 color가 없어(집계 응답) 카테고리 목록에서 가져와 맞춘다. 이름 텍스트 위가 아니라
// 옆에 점으로 둔다 — 사용자 지정 색이라 대비를 계산할 수 없다(PRD.md 5.1, CategoryBreakdown과 동일).
export function AnomalyCard({ anomalies }: AnomalyCardProps) {
  const categoriesQuery = useCategoriesQuery();

  if (anomalies.length === 0) return null;

  const colorByCategoryId = new Map(
    (categoriesQuery.data ?? [])
      .filter((category) => HEX_COLOR_PATTERN.test(category.color))
      .map((category) => [category.id, category.color]),
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 tracking-wider">
      <p className="text-sm text-muted-foreground">이상치 안내</p>
      <ul className="mt-3 flex flex-col gap-3">
        {anomalies.slice(0, 3).map((anomaly) => (
          <li key={anomaly.categoryId} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: colorByCategoryId.get(anomaly.categoryId) ?? "var(--muted-foreground)" }}
              aria-hidden
            />
            <span>
              {anomaly.name}이(가) 평소보다 <strong>{Math.round(Math.abs(anomaly.deltaRatio) * 100)}%</strong>{" "}
              {anomaly.deltaRatio >= 0 ? "높아요" : "낮아요"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
