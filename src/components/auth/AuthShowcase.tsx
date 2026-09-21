"use client";

import { motion, useReducedMotion } from "motion/react";

import { GRAIN, GRAIN_CLASS, PAPER_BACKGROUND } from "@/components/illustration/paper";

// 로그인·회원가입 화면 왼쪽(모바일에서는 위쪽) 패널. 디자인 방향은 "조용한 장부" —
// 웜 아이보리 종이 위에 Clay·딥 브라운·포레스트 그린만 쓰고, 기억에 남는 순간을 하나로 모은다:
// 그래프 선이 스스로 그려지고(예측), 동전이 떨어지고(기록), 도장이 찍힌다(무지출).
// 색은 전부 테마 토큰(var(--...))이라 라이트/다크가 자동으로 따라온다. 이미지 파일은 새로 만들지 않고
// SVG를 직접 그리며, 도장만 기존 public/assets/no-spend-stamp.png를 재사용한다(next/image 미사용, CLAUDE.md 3장).

// 카드 안 그래프: 완만히 오르다 끝에서 꺾이는 소비 곡선. 끝점 (306,150)에 점을 찍는다.
const SPARK_LINE = "M84 206 C112 200 128 178 152 184 S196 214 222 184 S274 132 306 150";
const SPARK_AREA = `${SPARK_LINE} L306 236 L84 236 Z`;

const COINS = [
  { cx: 338, cy: 74, delay: 0.95 },
  { cx: 372, cy: 128, delay: 1.07 },
  { cx: 318, cy: 32, delay: 1.19 },
] as const;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function Chip({
  className,
  delay,
  float,
  children,
}: {
  className: string;
  delay: number;
  float: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={float ? { opacity: 0, y: 10, scale: 0.94 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: EASE_OUT }}
    >
      {/* 등장이 끝난 뒤에만 아주 작게 떠다닌다. 사용자 동작과 무관한 움직임이라 진폭을 5px로 제한한다. */}
      <motion.div
        className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium"
        animate={float ? { y: [0, -5, 0] } : undefined}
        transition={{ duration: 5.5, delay: delay + 0.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function AuthShowcase() {
  // reduce가 true면 모든 initial을 끄고(false) 최종 상태로 바로 그린다.
  const reduce = useReducedMotion() ?? false;
  const motionOn = !reduce;

  return (
    <aside
      className="relative isolate flex min-h-64 flex-col justify-between overflow-hidden p-6 lg:min-h-dvh lg:p-12"
      style={{ background: PAPER_BACKGROUND }}
    >
      <div aria-hidden className={GRAIN_CLASS} style={{ backgroundImage: GRAIN }} />

      <p className="hidden font-heading text-xl font-bold text-logo lg:block">포켓로그</p>

      <div
        role="img"
        aria-label="지출 예측 그래프와 고정지출 감지 화면을 표현한 일러스트"
        className="relative mx-auto my-4 w-full max-w-xs lg:my-0 lg:max-w-lg"
      >
        <svg viewBox="0 0 420 300" className="h-auto w-full overflow-visible" fill="none">
          <defs>
            <linearGradient id="spark-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--income)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--income)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 뒤 카드(딥 클레이): 앞 카드와 반대로 기울여 깊이를 만든다 */}
          <g transform="rotate(6 200 150)">
            <motion.rect
              x="74"
              y="58"
              width="262"
              height="196"
              rx="24"
              fill="var(--net)"
              initial={motionOn ? { opacity: 0, y: 28 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
            />
          </g>

          {/* 앞 카드(장부) */}
          <g transform="rotate(-4 195 160)">
            <motion.g
              initial={motionOn ? { opacity: 0, y: 32 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22, ease: EASE_OUT }}
            >
              <rect x="60" y="60" width="270" height="200" rx="24" fill="var(--card)" stroke="var(--border)" />
              {/* 라벨 줄과 큰 금액 줄: 실제 글자 대신 막대로 그려 언어·수치와 무관한 장식으로 둔다 */}
              <rect x="84" y="86" width="64" height="8" rx="4" fill="var(--muted-foreground)" opacity="0.4" />
              <rect x="84" y="104" width="120" height="14" rx="7" fill="var(--foreground)" opacity="0.82" />

              <path d={SPARK_AREA} fill="url(#spark-area)" />
              {/* 이 화면의 핵심 순간: 예측 곡선이 왼쪽에서 오른쪽으로 그려진다 */}
              <motion.path
                d={SPARK_LINE}
                stroke="var(--income)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={motionOn ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, delay: 0.6, ease: "easeInOut" }}
              />
              <motion.circle
                cx="306"
                cy="150"
                r="6"
                fill="var(--income)"
                stroke="var(--card)"
                strokeWidth="3"
                initial={motionOn ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1.65, ease: EASE_OUT }}
                style={{ transformOrigin: "306px 150px" }}
              />

              {/* 카테고리 색 점 3개: 도넛·예산 막대와 같은 색 체계 */}
              <circle cx="92" cy="246" r="5" fill="var(--color-category-1)" />
              <rect x="104" y="243" width="34" height="6" rx="3" fill="var(--muted)" />
              <circle cx="160" cy="246" r="5" fill="var(--color-category-5)" />
              <rect x="172" y="243" width="34" height="6" rx="3" fill="var(--muted)" />
              <circle cx="228" cy="246" r="5" fill="var(--color-category-3)" />
              <rect x="240" y="243" width="34" height="6" rx="3" fill="var(--muted)" />
            </motion.g>
          </g>

          {/* 동전: 기록이 쌓이는 느낌. 스프링으로 톡 떨어진다 */}
          {COINS.map((coin) => (
            <motion.g
              key={`${coin.cx}-${coin.cy}`}
              initial={motionOn ? { y: -90, opacity: 0 } : false}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 15, delay: coin.delay }}
            >
              <circle cx={coin.cx} cy={coin.cy} r="24" fill="var(--primary)" />
              <circle cx={coin.cx} cy={coin.cy} r="17" stroke="var(--primary-foreground)" strokeOpacity="0.55" strokeWidth="2" />
              <text
                x={coin.cx}
                y={coin.cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="19"
                fontWeight="700"
                fill="var(--primary-foreground)"
              >
                ₩
              </text>
            </motion.g>
          ))}
        </svg>

        {/* 무지출 도장: 앱에서 실제로 쓰는 그 도장을 카드 모서리에 찍는다 */}
        <motion.img
          src="/assets/no-spend-stamp.png"
          alt=""
          className="pointer-events-none absolute -bottom-5 -left-2 w-[26%] max-w-28"
          initial={motionOn ? { opacity: 0, scale: 1.6, rotate: -22 } : false}
          animate={{ opacity: 1, scale: 1, rotate: -10 }}
          transition={{ type: "spring", stiffness: 420, damping: 20, delay: 1.75 }}
        />

        {/* 제품의 핵심 가치를 보여주는 두 칩. 좁은 화면에서는 숨긴다 */}
        <div className="hidden lg:block">
          <Chip className="-top-2 left-0" delay={1.3} float={motionOn}>
            <span className="h-2 w-2 rounded-full bg-income" />
            이번 달 이 속도면 2,610,000원
          </Chip>
          <Chip className="-bottom-4 right-0" delay={1.5} float={motionOn}>
            <span className="h-2 w-2 rounded-full bg-primary" />
            넷플릭스 17,000원 · 3개월 연속
          </Chip>
        </div>
      </div>

      <div className="hidden lg:block">
        <p className="text-4xl leading-[1.15] font-extrabold tracking-tight text-foreground">
          3초 안에 기록하고,
          <br />
          이번 달을 미리 봐요.
        </p>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
          쌓인 기록으로 이번 달 지출을 예측하고, 매달 나가는 고정지출은 알아서 찾아드려요.
        </p>
      </div>
    </aside>
  );
}
