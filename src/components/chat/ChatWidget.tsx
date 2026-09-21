"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat/ChatPanel";

// 화면 가장자리에서 띄울 최소 간격(px)
const EDGE = 8;
// 이 거리(px)보다 적게 움직이면 드래그가 아니라 클릭으로 본다
const DRAG_THRESHOLD = 4;

// 모든 보호 화면에 항상 마운트된다((main)/layout.tsx). 열림 상태만 관리하고 실제 데이터
// 조회는 열렸을 때만 마운트되는 ChatPanel 안에서 일어난다 — 닫히면 쿼리도 함께 멈춘다.
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // 기본 위치(우하단 고정)에서 얼마나 옮겼는지. 버튼을 끌면 패널도 함께 따라간다.
  const rootRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; rect: DOMRect; origin: { x: number; y: number } } | null>(null);
  const movedRef = useRef(false);

  // 위젯(패널이 열려 있으면 패널 포함)이 화면 밖으로 나가 있으면 안으로 되돌린다.
  const fitToViewport = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = Math.max(EDGE - r.left, 0) + Math.min(window.innerWidth - EDGE - r.right, 0);
    const dy = Math.max(EDGE - r.top, 0) + Math.min(window.innerHeight - EDGE - r.bottom, 0);
    if (dx || dy) setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }, []);

  // 패널이 열려 위로 커지면서 화면 위로 넘칠 수 있고, 창 크기가 줄어도 마찬가지다.
  useLayoutEffect(() => {
    if (isOpen) fitToViewport();
  }, [isOpen, fitToViewport]);
  useEffect(() => {
    window.addEventListener("resize", fitToViewport);
    return () => window.removeEventListener("resize", fitToViewport);
  }, [fitToViewport]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!rootRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    movedRef.current = false;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      rect: rootRef.current.getBoundingClientRect(),
      origin: offset,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rawX = event.clientX - drag.startX;
    const rawY = event.clientY - drag.startY;
    if (!movedRef.current && Math.hypot(rawX, rawY) < DRAG_THRESHOLD) return;
    movedRef.current = true;
    // 시작 위치 기준으로 이동량을 화면 안으로 제한한다
    const dx = Math.min(Math.max(rawX, EDGE - drag.rect.left), window.innerWidth - EDGE - drag.rect.right);
    const dy = Math.min(Math.max(rawY, EDGE - drag.rect.top), window.innerHeight - EDGE - drag.rect.bottom);
    setOffset({ x: drag.origin.x + dx, y: drag.origin.y + dy });
  };

  const handleClick = () => {
    // 끌고 난 뒤에 따라오는 클릭은 패널을 여닫지 않는다
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    setIsOpen((prev) => !prev);
  };

  return (
    // 모바일 하단 탭 바(Header.tsx의 fixed bottom-0 nav)에 가리지 않도록 bottom을 그 높이만큼 띄운다.
    <div
      ref={rootRef}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      className="fixed right-4 bottom-20 z-50 flex flex-col items-end gap-3 sm:right-6 md:bottom-6"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <ChatPanel onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="button"
        size="icon-lg"
        className="size-14 cursor-grab touch-none rounded-full shadow-lg active:cursor-grabbing pointer-coarse:size-14"
        aria-label={isOpen ? "챗봇 닫기" : "챗봇 열기"}
        title="끌어서 위치 이동"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => (dragRef.current = null)}
        onPointerCancel={() => (dragRef.current = null)}
        onClick={handleClick}
      >
        {isOpen ? <X className="size-7" /> : <MessageCircle className="size-7" />}
      </Button>
    </div>
  );
}
