// 금액에 비례하는 넓이로 카테고리를 타일처럼 채운다. 절대 위치 div(%)로 그려 라이브러리를 쓰지 않는다 (CLAUDE.md 3장).

import { PALETTE, type ChartDatum } from "@/components/chart/CategoryDonut";

// 배치 계산용 가상 좌표계. 컨테이너를 2:1(aspect-[2/1])로 두어 이 좌표가 화면 비율과 같다.
const W = 200;
const H = 100;
// 이 크기(가상 좌표) 미만인 타일은 글자를 넣지 않는다. 정확한 값은 아래 목록이 보여준다.
const LABEL_MIN_W = 30;
const LABEL_MIN_H = 26;

type Tile = { item: ChartDatum & { color: string }; x: number; y: number; w: number; h: number };

// 큰 순으로 정렬한 항목을 합계가 절반에 가장 가까운 지점에서 둘로 나누고, 긴 변을 그 비율대로 자르며 재귀한다.
// 정밀한 squarified 알고리즘보다 단순하고, 항목이 열 개 안팎인 이 화면에서는 모양이 충분히 고르다.
function layout(items: Tile["item"][], x: number, y: number, w: number, h: number): Tile[] {
  if (items.length === 1) return [{ item: items[0], x, y, w, h }];

  const total = items.reduce((sum, d) => sum + d.value, 0);
  let acc = 0;
  let split = 1;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].value;
    split = i + 1;
    if (acc >= total / 2) break;
  }
  const ratio = items.slice(0, split).reduce((sum, d) => sum + d.value, 0) / total;
  const first = items.slice(0, split);
  const rest = items.slice(split);

  return w >= h
    ? [...layout(first, x, y, w * ratio, h), ...layout(rest, x + w * ratio, y, w * (1 - ratio), h)]
    : [...layout(first, x, y, w, h * ratio), ...layout(rest, x, y + h * ratio, w, h * (1 - ratio))];
}

// 배경색 위 글자는 흰색/짙은색 중 대비가 큰 쪽으로 고른다(사용자 지정 색이라 미리 정할 수 없다).
function inkOn(hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return "#141413";
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // 흰색(휘도 1)과의 대비 (1.05 / (lum + 0.05)) 가 짙은색(#141413, 휘도 ≈ 0.007)과의 대비 ((lum + 0.05) / 0.057)보다 크면 흰색
  return 1.05 / (lum + 0.05) > (lum + 0.05) / 0.057 ? "#FFFFFF" : "#141413";
}

export function CategoryTreemap({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return <p className="text-sm text-muted-foreground">데이터 없음</p>;

  // 색은 정렬 전 입력 순서로 정해 도넛·막대와 같게 한다. 0원 항목은 타일이 안 생기므로 뺀다.
  const items = data
    .map((d, index) => ({ ...d, color: d.color ?? PALETTE[index % PALETTE.length] }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const tiles = layout(items, 0, 0, W, H);

  return (
    <div className="relative aspect-[2/1] w-full" role="img" aria-label="카테고리별 지출 트리맵">
      {tiles.map(({ item, x, y, w, h }) => {
        const showLabel = w >= LABEL_MIN_W && h >= LABEL_MIN_H;
        return (
          <div
            key={item.name}
            title={`${item.name}: ${Math.round((item.value / total) * 100)}%`}
            className="absolute p-0.5"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%` }}
          >
            <div
              className="flex h-full w-full flex-col justify-end overflow-hidden rounded-md p-2 text-xs leading-tight"
              style={{ backgroundColor: item.color, color: inkOn(item.color) }}
            >
              {showLabel && (
                <>
                  <span className="truncate font-semibold">{item.name}</span>
                  <span className="tabular-nums opacity-90">{Math.round((item.value / total) * 100)}%</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
