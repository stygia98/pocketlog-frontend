// 앱 전체에서 쓰는 일러스트 세트. 이미지 파일 없이 SVG를 직접 그린다(next/image 미사용, CLAUDE.md 3장).
// 같은 문법으로 통일했다: 종이를 오려 붙인 듯한 납작한 도형 + 굵고 둥근 선, 색은 전부 테마 토큰(var(--...))이라
// 라이트/다크를 따로 그리지 않는다. 장식이므로 스크린 리더에는 숨긴다(aria-hidden) — 의미는 옆 제목·문구가 전달한다.

import type { ReactNode } from "react";

// 모든 일러스트가 공유하는 바닥: 은은한 Clay 원 + 수입 그린 원 + 바닥 그림자. 캔버스는 200x150.
function Frame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 200 150" aria-hidden className="h-auto w-full" fill="none">
      <circle cx="100" cy="70" r="58" fill="var(--primary)" opacity="0.1" />
      <circle cx="148" cy="38" r="22" fill="var(--income)" opacity="0.1" />
      <ellipse cx="100" cy="134" rx="58" ry="7" fill="var(--foreground)" opacity="0.07" />
      {children}
    </svg>
  );
}

// 4갈래 반짝임. 중심 (0,0) 기준이라 <g transform="translate(x y) scale(s)">로 배치한다.
function Sparkle({ x, y, s = 1, fill = "var(--primary)" }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <path
      d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill={fill}
    />
  );
}

function Coin({ cx, cy, r = 11, className }: { cx: number; cy: number; r?: number; className?: string }) {
  return (
    <g className={className}>
      <circle cx={cx} cy={cy} r={r} fill="var(--card)" stroke="var(--primary)" strokeWidth="3" />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={r * 0.95}
        fontWeight="700"
        fill="var(--primary)"
      >
        ₩
      </text>
    </g>
  );
}

/** 거래가 하나도 없을 때: 펼친 장부와 첫 줄을 기다리는 빈 칸, 연필. */
export function LedgerArt() {
  return (
    <Frame>
      <rect x="28" y="38" width="144" height="88" rx="12" fill="var(--net)" />
      <rect x="34" y="42" width="66" height="78" rx="8" fill="var(--card)" stroke="var(--border)" />
      <rect x="100" y="42" width="66" height="78" rx="8" fill="var(--card)" stroke="var(--border)" />
      <rect x="47" y="58" width="40" height="5" rx="2.5" fill="var(--muted-foreground)" opacity="0.35" />
      <rect x="47" y="72" width="30" height="5" rx="2.5" fill="var(--muted-foreground)" opacity="0.35" />
      <rect x="47" y="86" width="36" height="5" rx="2.5" fill="var(--muted-foreground)" opacity="0.35" />
      <rect x="113" y="58" width="40" height="5" rx="2.5" fill="var(--muted-foreground)" opacity="0.35" />
      {/* 아직 비어 있는 첫 줄 */}
      <rect x="112" y="72" width="42" height="22" rx="7" stroke="var(--primary)" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="133" cy="83" r="6" fill="var(--primary)" />
      <path d="M133 80.5 V85.5 M130.5 83 H135.5" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" />
      {/* 연필 */}
      <g transform="rotate(38 158 34)">
        <rect x="154" y="8" width="9" height="42" rx="2" fill="var(--income)" />
        <rect x="154" y="8" width="9" height="7" rx="2" fill="var(--primary)" />
        <path d="M154 50 H163 L158.5 60 Z" fill="#F2D6B3" />
        <path d="M156.5 56 H160.5 L158.5 60 Z" fill="var(--foreground)" />
      </g>
      <Coin cx={44} cy={28} r={11} className="art-bob" />
      <Sparkle x={172} y={82} s={0.8} />
    </Frame>
  );
}

/** 검색 결과가 없을 때: 돋보기가 비어 있는 종이를 비춘다. */
export function SearchArt() {
  return (
    <Frame>
      <rect x="38" y="42" width="100" height="76" rx="10" fill="var(--card)" stroke="var(--border)" />
      <rect x="50" y="56" width="52" height="5" rx="2.5" fill="var(--muted-foreground)" opacity="0.3" />
      <rect x="50" y="70" width="38" height="5" rx="2.5" fill="var(--muted-foreground)" opacity="0.3" />
      <rect x="50" y="84" width="46" height="5" rx="2.5" fill="var(--muted-foreground)" opacity="0.3" />
      {/* 돋보기 */}
      <line x1="132" y1="88" x2="156" y2="112" stroke="var(--net)" strokeWidth="11" strokeLinecap="round" />
      <circle cx="112" cy="68" r="27" fill="var(--card)" fillOpacity="0.85" stroke="var(--foreground)" strokeOpacity="0.85" strokeWidth="8" />
      <circle cx="104" cy="66" r="2.6" fill="var(--muted-foreground)" opacity="0.55" />
      <circle cx="112" cy="66" r="2.6" fill="var(--muted-foreground)" opacity="0.55" />
      <circle cx="120" cy="66" r="2.6" fill="var(--muted-foreground)" opacity="0.55" />
      <Sparkle x={58} y={30} s={0.9} />
      <Sparkle x={166} y={50} s={0.7} fill="var(--income)" />
    </Frame>
  );
}

/** 카테고리가 없을 때: 색이 다른 이름표 세 장. 도넛·예산 막대와 같은 카테고리 색을 쓴다. */
export function TagsArt() {
  const tag = "M8 0 H52 L66 20 L52 40 H8 A8 8 0 0 1 0 32 V8 A8 8 0 0 1 8 0 Z";
  return (
    <Frame>
      <g transform="translate(36 30) rotate(-8 33 20)">
        <path d={tag} fill="var(--color-category-1)" />
        <circle cx="14" cy="20" r="4" fill="var(--card)" />
        <rect x="24" y="17" width="26" height="6" rx="3" fill="#fff" opacity="0.85" />
      </g>
      <g transform="translate(74 60) rotate(5 33 20)">
        <path d={tag} fill="var(--color-category-3)" />
        <circle cx="14" cy="20" r="4" fill="var(--card)" />
        <rect x="24" y="17" width="20" height="6" rx="3" fill="#fff" opacity="0.85" />
      </g>
      <g transform="translate(40 88) rotate(-3 33 20)">
        <path d={tag} fill="var(--color-category-5)" />
        <circle cx="14" cy="20" r="4" fill="var(--card)" />
        <rect x="24" y="17" width="28" height="6" rx="3" fill="#fff" opacity="0.85" />
      </g>
      <Sparkle x={158} y={32} s={0.9} />
      <Sparkle x={34} y={72} s={0.6} fill="var(--income)" />
    </Frame>
  );
}

/** 예산이 없을 때: 동전을 기다리는 저금통. */
export function PiggyArt() {
  return (
    <Frame>
      {/* 다리와 꼬리 */}
      <rect x="76" y="106" width="13" height="17" rx="5" fill="var(--net)" />
      <rect x="112" y="106" width="13" height="17" rx="5" fill="var(--net)" />
      <path d="M58 84 C46 80 48 68 58 70" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" />
      {/* 몸통 */}
      <ellipse cx="100" cy="86" rx="46" ry="34" fill="var(--primary)" />
      <path d="M126 58 L138 44 L142 64 Z" fill="var(--net)" />
      {/* 코와 눈 */}
      <ellipse cx="144" cy="92" rx="13" ry="11" fill="var(--net)" />
      <circle cx="140" cy="92" r="2.2" fill="var(--card)" opacity="0.8" />
      <circle cx="148" cy="92" r="2.2" fill="var(--card)" opacity="0.8" />
      <circle cx="126" cy="78" r="3.4" fill="var(--foreground)" />
      {/* 동전 투입구 */}
      <rect x="86" y="55" width="28" height="6" rx="3" fill="var(--net)" />
      <Coin cx={100} cy={30} r={12} className="art-bob" />
      <Sparkle x={156} y={34} s={0.8} />
    </Frame>
  );
}

/** 불러오기에 실패했을 때: 끊어진 그래프와 경고 배지. */
export function ErrorArt() {
  return (
    <Frame>
      <rect x="38" y="42" width="124" height="78" rx="12" fill="var(--card)" stroke="var(--border)" />
      <rect x="52" y="56" width="42" height="6" rx="3" fill="var(--muted-foreground)" opacity="0.35" />
      <path d="M52 104 L74 88 L94 98" stroke="var(--income)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M94 98 L112 80 L142 90" stroke="var(--muted-foreground)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 9" opacity="0.6" />
      <circle cx="152" cy="46" r="15" fill="var(--destructive)" />
      <rect x="150.5" y="38" width="3" height="10" rx="1.5" fill="#fff" />
      <circle cx="152" cy="54" r="2" fill="#fff" />
    </Frame>
  );
}

/** CSV 가져오기·내보내기: 표 위에 올라선 화살표. */
export function CsvArt() {
  return (
    <Frame>
      <rect x="56" y="34" width="84" height="92" rx="10" fill="var(--muted)" transform="rotate(6 98 80)" />
      <rect x="46" y="30" width="84" height="92" rx="10" fill="var(--card)" stroke="var(--border)" />
      <path d="M46 40 a10 10 0 0 1 10-10 h64 a10 10 0 0 1 10 10 v10 h-84 Z" fill="var(--income)" />
      <line x1="46" y1="66" x2="130" y2="66" stroke="var(--border)" />
      <line x1="46" y1="82" x2="130" y2="82" stroke="var(--border)" />
      <line x1="46" y1="98" x2="130" y2="98" stroke="var(--border)" />
      <line x1="74" y1="50" x2="74" y2="122" stroke="var(--border)" />
      <line x1="102" y1="50" x2="102" y2="122" stroke="var(--border)" />
      <circle cx="140" cy="108" r="17" fill="var(--primary)" />
      <path d="M140 100 V116 M133 109 L140 116 L147 109" stroke="var(--primary-foreground)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <Sparkle x={160} y={44} s={0.8} />
    </Frame>
  );
}

/** 대시보드 히어로: 동전을 품은 주머니와 그 위에서 자라는 새싹 — "포켓"과 "쌓이는 기록"을 한 장면에. */
export function PocketArt() {
  return (
    <Frame>
      {/* 새싹 */}
      <path d="M100 38 V18" stroke="var(--income)" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="89" cy="18" rx="11" ry="5.5" transform="rotate(-28 89 18)" fill="var(--income)" />
      <ellipse cx="112" cy="14" rx="11" ry="5.5" transform="rotate(28 112 14)" fill="var(--income)" opacity="0.7" />
      {/* 주머니 밖으로 삐져나온 동전 */}
      <Coin cx={76} cy={62} r={13} />
      <Coin cx={124} cy={62} r={13} />
      <Coin cx={100} cy={52} r={14} className="art-bob" />
      {/* 주머니 본체와 스티치 */}
      <path d="M46 72 H154 L146 120 a10 10 0 0 1 -10 8 H64 a10 10 0 0 1 -10 -8 Z" fill="var(--net)" />
      <rect x="40" y="64" width="120" height="16" rx="8" fill="var(--primary)" />
      <path d="M58 92 H142" stroke="var(--card)" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
      <Sparkle x={38} y={40} s={0.8} />
      <Sparkle x={166} y={30} s={0.6} fill="var(--income)" />
    </Frame>
  );
}
