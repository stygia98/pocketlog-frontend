"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategoriesQuery } from "@/hooks/useCategories";
import { useMonthlyStatsQuery, useRecurringQuery } from "@/hooks/useStats";
import { useTransactionListQuery } from "@/hooks/useTransactions";
import { buildAnswer } from "@/lib/chat/answers";
import { parseIntent } from "@/lib/chat/intents";
import { todayString, toYearMonthString } from "@/lib/date";
import type { ChatData, ChatIntent, ChatMessage } from "@/types/chat";

interface ChatPanelProps {
  onClose: () => void;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "bot",
  lines: ["안녕하세요! 이번 달(또는 다른 달) 지출·수입, 카테고리별 지출, 최근 내역, 예산, 고정지출을 물어보세요."],
};

const CHECKING_MESSAGE: ChatMessage = { id: "checking", role: "bot", lines: ["확인하고 있어요..."] };

// yearMonth를 필요로 하는 3종 의도만 targetYearMonth 재조회 대상이다. 나머지(help·recurring·
// recent_transactions)는 항상 현재 데이터로 즉시 답한다.
function needsMonthlyStats(intent: ChatIntent): intent is Extract<
  ChatIntent,
  { type: "monthly_summary" | "category_spend" | "budget_status" }
> {
  return intent.type === "monthly_summary" || intent.type === "category_spend" || intent.type === "budget_status";
}

// 패널이 열려 있을 때만 마운트된다 — 여기서 부르는 4개 쿼리는 기존 화면들이 쓰던 훅을
// 그대로 재사용한다(새 백엔드 엔드포인트 없음). 닫히면 이 컴포넌트가 언마운트되어 쿼리도 멈춘다.
export function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  // 실제 오늘 기준 이번 달. 월만 언급된 질문("9월")의 연도 기본값이자, 아무 달도 언급하지
  // 않은 질문의 기본 조회 대상이다 — targetYearMonth(직전에 조회한 달)를 쓰면 안 된다.
  // 그러면 "9월"만 물었을 때 직전에 봤던 달의 연도가 섞여 들어간다.
  const currentYearMonth = toYearMonthString(new Date());
  // 질문에서 다른 달(예: "9월", "2025년 9월")을 언급하면 이 값을 그 달로 바꿔 다시 조회한다.
  const [targetYearMonth, setTargetYearMonth] = useState(currentYearMonth);
  const [pendingIntent, setPendingIntent] = useState<ChatIntent | null>(null);

  const asOf = todayString();

  const categoriesQuery = useCategoriesQuery();
  const statsQuery = useMonthlyStatsQuery(targetYearMonth, asOf);
  const recentTransactionsQuery = useTransactionListQuery({ page: 0, size: 5 });
  const recurringQuery = useRecurringQuery(asOf);

  const isReady =
    !categoriesQuery.isLoading &&
    !statsQuery.isLoading &&
    !recentTransactionsQuery.isLoading &&
    !recurringQuery.isLoading;

  // targetYearMonth를 바꾼 직후엔 statsQuery가 아직 이전 달 데이터를 들고 있을 수 있다.
  // 새 달 데이터가 도착하면(yearMonth 일치) 대기 중이던 질문에 답한다.
  useEffect(() => {
    if (!pendingIntent) return;
    if (statsQuery.isLoading || statsQuery.data?.yearMonth !== targetYearMonth) return;

    const data: ChatData = {
      stats: statsQuery.data,
      recentTransactions: recentTransactionsQuery.data?.content,
      recurring: recurringQuery.data,
    };
    setMessages((prev) => [
      ...prev.slice(0, -1), // "확인하고 있어요..." 자리를 실제 답으로 교체
      { id: crypto.randomUUID(), role: "bot", lines: buildAnswer(pendingIntent, data) },
    ]);
    setPendingIntent(null);
  }, [pendingIntent, statsQuery.data, statsQuery.isLoading, targetYearMonth, recentTransactionsQuery.data, recurringQuery.data]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || pendingIntent) return;

    const intent = parseIntent(text, categoriesQuery.data ?? [], currentYearMonth);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", lines: [text] };

    if (needsMonthlyStats(intent) && intent.yearMonth !== targetYearMonth) {
      // 다른 달을 물어봤다 — 그 달을 다시 불러오는 동안 대기 메시지를 보여준다.
      setTargetYearMonth(intent.yearMonth);
      setPendingIntent(intent);
      setMessages((prev) => [...prev, userMessage, CHECKING_MESSAGE]);
      setInput("");
      return;
    }

    const data: ChatData = {
      stats: statsQuery.data,
      recentTransactions: recentTransactionsQuery.data?.content,
      recurring: recurringQuery.data,
    };
    setMessages((prev) => [
      ...prev,
      userMessage,
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
          disabled={!isReady || !!pendingIntent}
          aria-label="챗봇에게 질문 입력"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!isReady || !!pendingIntent || input.trim().length === 0}
          aria-label="전송"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
