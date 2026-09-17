import { MonthHeatmap } from "@/components/chart/MonthHeatmap";
import type { DailyStat } from "@/types/stats";

interface DailyHeatmapProps {
  daily: DailyStat[];
}

// STAT-08. MonthHeatmap(components/chart)은 value 하나만 받으므로 지출 기준으로 변환한다.
// 서버가 그 달의 모든 날을 이미 0으로 채워 보내므로(CLAUDE.md 5장), 여기서 빈 날을 채우지 않고
// 그대로 전달한다.
export function DailyHeatmap({ daily }: DailyHeatmapProps) {
  const data = daily.map((d) => ({ date: d.date, value: d.expense }));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">일별 지출</p>
      <div className="mt-3">
        <MonthHeatmap data={data} />
      </div>
    </div>
  );
}
