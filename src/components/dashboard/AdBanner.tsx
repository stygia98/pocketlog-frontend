"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { AD_BANNERS } from "@/lib/banners";

// 자동으로 넘어가는 시간. 읽을 틈을 주려고 넉넉히 잡는다.
const AUTOPLAY_MS = 5000;

// 좌우로 이 거리(px) 이상 끌거나 이 속도(px/s) 이상으로 밀면 다음·이전 장으로 넘긴다.
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;

// 광고 배너 캐러셀. 라이브러리 없이 한 번에 한 장만 그리고, 자동 넘김 + 점 버튼 + 마우스 드래그/터치 스와이프로 이동한다.
// 마우스를 올리거나 키보드 포커스가 있는 동안, 끄는 동안, 그리고 모션 감소 설정에서는 자동으로 넘기지 않는다.
export function AdBannerCarousel() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const paused = hovered || dragging;
  // 끌다 놓으면 브라우저가 링크 클릭을 이어서 발생시킨다 — 끈 직후의 클릭은 막아 광고 창이 열리지 않게 한다.
  const draggedRef = useRef(false);

  const move = (step: number) => setIndex((current) => (current + step + AD_BANNERS.length) % AD_BANNERS.length);

  useEffect(() => {
    if (reduce || paused) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % AD_BANNERS.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [reduce, paused]);

  const ad = AD_BANNERS[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="광고"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="relative isolate overflow-hidden rounded-2xl border border-border"
    >
      {/* 퇴장 애니메이션을 기다리면 점을 눌러도 한 박자 늦게 바뀐다. key로 새 장을 바로 갈아 끼우고 페이드인만 한다. */}
      <motion.a
        key={ad.id}
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        draggable={false}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragStart={() => {
          draggedRef.current = true;
          setDragging(true);
        }}
        onDragEnd={(_, info) => {
          setDragging(false);
          if (Math.abs(info.offset.x) > SWIPE_DISTANCE || Math.abs(info.velocity.x) > SWIPE_VELOCITY) {
            move(info.offset.x < 0 ? 1 : -1);
          }
          // 이어지는 click 이벤트가 지나간 뒤에 풀어야 하므로 한 틱 미룬다.
          setTimeout(() => {
            draggedRef.current = false;
          }, 0);
        }}
        onClick={(event) => {
          if (draggedRef.current) event.preventDefault();
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.3 }}
        className="flex h-40 cursor-grab items-center justify-between gap-6 px-6 pb-6 select-none active:cursor-grabbing sm:h-44 sm:px-8"
        style={{
          // 양 끝은 광고 색을 옅게, 가운데는 카드색(라이트에서 흰색, 다크에서 어두운 카드색)으로 둔다.
          background: `linear-gradient(120deg, color-mix(in oklab, ${ad.tint} 20%, var(--card)) 0%, var(--card) 50%, color-mix(in oklab, ${ad.tint} 12%, var(--card)) 100%)`,
        }}
      >
        <div className="min-w-0">
          <span className="rounded-full border border-border bg-card/70 px-2 py-0.5 text-xs text-muted-foreground">
            광고
          </span>
          <p className="mt-2 text-xl leading-tight font-extrabold tracking-tight sm:text-2xl">{ad.title}</p>
          <p className="mt-1 text-muted-foreground">{ad.description}</p>
          <span className="sr-only"> (새 창에서 열림)</span>
        </div>
        {/* 이미지는 장식이다. 의미는 옆 제목·설명이 전달한다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.image}
          alt=""
          aria-hidden
          draggable={false}
          className="hidden h-full w-auto shrink-0 py-3 sm:block"
        />
      </motion.a>

      {/* 점 버튼은 링크 밖에 둔다(링크 안에 버튼을 넣지 않는다). 눌러야 하는 크기는 패딩으로 확보한다. */}
      <div className="absolute bottom-1 left-4 z-10 flex sm:left-6">
        {AD_BANNERS.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`광고 ${i + 1} / ${AD_BANNERS.length}`}
            aria-current={i === index}
            className="group p-2 pointer-coarse:p-3"
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-foreground/70" : "w-2 bg-foreground/25 group-hover:bg-foreground/45"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
