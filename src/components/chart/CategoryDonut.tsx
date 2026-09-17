// SVG 직접 구현. props는 Recharts의 <Pie data={...} dataKey="value" nameKey="name" />와 같은
// 모양으로 고정해 둔다 — 나중에 축·툴팁·줌 중 둘 이상이 필요해지면 이 파일 내부만 recharts로
// 바꾸고 화면 코드는 건드리지 않는다 (CLAUDE.md 3장).

export type ChartDatum = { name: string; value: number; color?: string };

// 색 미지정 시 배정하는 순서 (CLAUDE.md 8장 카테고리 팔레트, globals.css --color-category-* 와 동일).
const PALETTE = [
  "var(--color-category-1)",
  "var(--color-category-2)",
  "var(--color-category-3)",
  "var(--color-category-4)",
  "var(--color-category-5)",
  "var(--color-category-6)",
  "var(--color-category-7)",
  "var(--color-category-8)",
  "var(--color-category-9)",
];

interface CategoryDonutProps {
  data: ChartDatum[];
  size?: number;
  strokeWidth?: number;
}

export function CategoryDonut({ data, size = 160, strokeWidth = 24 }: CategoryDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total <= 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full border border-border text-sm text-muted-foreground"
      >
        데이터 없음
      </div>
    );
  }

  let dashOffsetAcc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="카테고리별 지출 비중">
      {/* 12시 방향부터 시계 방향으로 채우기 위해 -90도 회전 */}
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d, index) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const dashOffset = -dashOffsetAcc;
          dashOffsetAcc += dash;

          return (
            <circle
              key={d.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color ?? PALETTE[index % PALETTE.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={dashOffset}
            >
              <title>{`${d.name}: ${Math.round(fraction * 100)}%`}</title>
            </circle>
          );
        })}
      </g>
    </svg>
  );
}
