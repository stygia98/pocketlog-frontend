// 종이 배경 공용 스타일. 로그인 패널(AuthShowcase)과 대시보드 히어로가 같은 질감을 쓴다.

// 종이 질감(grain). 외부 파일 없이 SVG feTurbulence를 data URI로 넣는다.
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
export const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

// 웜 톤 메시 그라데이션: 위쪽은 Clay, 아래쪽은 수입 그린이 은은하게 번지는 종이.
export const PAPER_BACKGROUND =
  "radial-gradient(120% 80% at 8% 0%, color-mix(in oklab, var(--primary) 24%, transparent), transparent 62%)," +
  "radial-gradient(90% 70% at 100% 100%, color-mix(in oklab, var(--income) 20%, transparent), transparent 58%)," +
  "var(--secondary)";

// 질감 오버레이에 붙이는 클래스. 라이트는 multiply로 살짝 어둡게, 다크는 soft-light로 살짝 밝게 얹는다.
export const GRAIN_CLASS = "pointer-events-none absolute inset-0 -z-10 opacity-[0.16] mix-blend-multiply dark:opacity-25 dark:mix-blend-soft-light";
