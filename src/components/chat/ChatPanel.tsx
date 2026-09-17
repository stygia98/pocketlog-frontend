"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategoriesQuery } from "@/hooks/useCategories";
import { useMonthlyStatsQuery, useRecurringQuery } from "@/hooks/useStats";
import { useTransactionListQuery } from "@/hooks/useTransactions";
import { buildAnswer } from "@/lib/chat/answers";
import { parseIntent } from "@/lib/chat/intents";
import { todayString, toYearMonthString } from "@/lib/date";
import type { ChatData, ChatMessage } from "@/types/chat";

interface ChatPanelProps {
  onClose: () => void;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "bot",
  lines: ["안녕하세요! 이번 달 지출·수입, 카테고리별 지출, 최근 내역, 예산, 고정지출을 물어보세요."],
};

// 패널이 열려 있을 때만 마운트된다 — 여기서 부르는 4개 쿼리는 기존 화면들이 쓰던 훅을
// 그대로 재사용한다(새 백엔드 엔드포인트 없음). 닫히면 이 컴포넌트가 언마운트되어 쿼리도 멈춘다.
export function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");

  const asOf = todayString();
  const yearMonth = toYearMonthString(new Date());

  const categoriesQuery = useCategoriesQuery();
  const statsQuery = useMonthlyStatsQuery(yearMonth, asOf);
  const recentTransactionsQuery = useTransactionListQuery({ page: 0, size: 5 });
  const recurringQuery = useRecurringQuery(asOf);

  const isReady =
    !categoriesQuery.isLoading &&
    !statsQuery.isLoading &&
    !recentTransactionsQuery.isLoading &&
    !recurringQuery.isLoading;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    const intent = parseIntent(text, categoriesQuery.data ?? []);
    const data: ChatData = {
      stats: statsQuery.data,
      recentTransactions: recentTransactionsQuery.data?.content,
      recurring: recurringQuery.data,
    };

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", lines: [text] },
      { id: crypto.randomUUID(), role: "bot", lines: buildAnswer(intent, data) },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:w-96">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">머니로그 도우미</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
          aria-label="챗봇 닫기"
        >
          닫기
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-left text-sm ${
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {message.lines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isReady ? "예: 이번달 지출 얼마야" : "불러오는 중..."}
          disabled={!isReady}
          aria-label="챗봇에게 질문 입력"
        />
        <Button type="submit" size="icon" disabled={!isReady || input.trim().length === 0} aria-label="전송">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
