"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat/ChatPanel";

// 모든 보호 화면에 항상 마운트된다((main)/layout.tsx). 열림 상태만 관리하고 실제 데이터
// 조회는 열렸을 때만 마운트되는 ChatPanel 안에서 일어난다 — 닫히면 쿼리도 함께 멈춘다.
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    // 모바일 하단 탭 바(Header.tsx의 fixed bottom-0 nav)에 가리지 않도록 bottom을 그 높이만큼 띄운다.
    <div className="fixed right-4 bottom-20 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
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
        className="rounded-full shadow-lg"
        aria-label={isOpen ? "챗봇 닫기" : "챗봇 열기"}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
}
