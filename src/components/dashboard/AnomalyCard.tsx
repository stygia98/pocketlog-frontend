import type { Anomaly } from "@/types/stats";

interface AnomalyCardProps {
  anomalies: Anomaly[];
}

// STAT-05. 빈 배열이면 카드 자체를 렌더하지 않는다 — 빈 카드가 남으면 안 된다.
export function AnomalyCard({ anomalies }: AnomalyCardProps) {
  if (anomalies.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">이상치 안내</p>
      <ul className="mt-2 flex flex-col gap-1">
        {anomalies.slice(0, 3).map((anomaly) => (
          <li key={anomaly.categoryId} className="text-sm">
            {anomaly.name}이(가) 평소보다 {Math.round(Math.abs(anomaly.deltaRatio) * 100)}%{" "}
            {anomaly.deltaRatio >= 0 ? "높아요" : "낮아요"}
          </li>
        ))}
      </ul>
    </div>
  );
}
