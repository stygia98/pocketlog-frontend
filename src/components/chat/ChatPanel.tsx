"use client";

import Link from "next/link";
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
import type { TransactionListParams } from "@/lib/queryKeys";
import type { ChatData, ChatIntent, ChatMessage } from "@/types/chat";

const DEFAULT_LIST_FILTERS: TransactionListParams = { page: 0, size: 5 };

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
// transactions_list)는 각자의 상태(listFilters 등)에 따로 반응한다.
function needsMonthlyStats(intent: ChatIntent): intent is Extract<
  ChatIntent,
  { type: "monthly_summary" | "category_spend" | "budget_status" }
> {
  return intent.type === "monthly_summary" || intent.type === "category_spend" || intent.type === "budget_status";
}

function needsTransactionsList(intent: ChatIntent): intent is Extract<ChatIntent, { type: "transactions_list" }> {
  return intent.type === "transactions_list";
}

function toListParams(filters: Extract<ChatIntent, { type: "transactions_list" }>["filters"]): TransactionListParams {
  return { page: 0, size: filters.size, type: filters.type, categoryId: filters.categoryId, from: filters.from, to: filters.to };
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
  // "내역"류 질문이 요청한 필터. 기본값은 기존 "최근 5건" 동작과 같다.
  const [listFilters, setListFilters] = useState<TransactionListParams>(DEFAULT_LIST_FILTERS);
  const [pendingIntent, setPendingIntent] = useState<ChatIntent | null>(null);

  const asOf = todayString();

  const categoriesQuery = useCategoriesQuery();
  const statsQuery = useMonthlyStatsQuery(targetYearMonth, asOf);
  const transactionsListQuery = useTransactionListQuery(listFilters);
  const recurringQuery = useRecurringQuery(asOf);

  const isReady =
    !categoriesQuery.isLoading &&
    !statsQuery.isLoading &&
    !transactionsListQuery.isLoading &&
    !recurringQuery.isLoading;

  // targetYearMonth·listFilters를 바꾼 직후엔 해당 쿼리가 아직 이전 데이터를 들고 있을 수 있다.
  // 각 쿼리는 자신의 상태(targetYearMonth/listFilters)에 바로 묶여 있으므로, isLoading이 꺼지는
  // 시점의 data는 항상 "지금 기다리는 바로 그 요청"의 결과다.
  useEffect(() => {
    if (!pendingIntent) return;
    if (needsMonthlyStats(pendingIntent) && (statsQuery.isLoading || statsQuery.data?.yearMonth !== targetYearMonth)) return;
    if (needsTransactionsList(pendingIntent) && transactionsListQuery.isLoading) return;

    const data: ChatData = {
      stats: statsQuery.data,
      transactionsList: transactionsListQuery.data?.content,
      recurring: recurringQuery.data,
    };
    setMessages((prev) => [
      ...prev.slice(0, -1), // "확인하고 있어요..." 자리를 실제 답으로 교체
      { id: crypto.randomUUID(), role: "bot", lines: buildAnswer(pendingIntent, data) },
    ]);
    setPendingIntent(null);
  }, [
    pendingIntent,
    statsQuery.data,
    statsQuery.isLoading,
    targetYearMonth,
    transactionsListQuery.data,
    transactionsListQuery.isLoading,
    recurringQuery.data,
  ]);

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

    if (needsTransactionsList(intent)) {
      const requestedParams = toListParams(intent.filters);
      if (JSON.stringify(requestedParams) !== JSON.stringify(listFilters)) {
        // 다른 필터(기간·구분·카테고리·건수)를 물어봤다 — 그 조합을 다시 불러오는 동안 대기한다.
        setListFilters(requestedParams);
        setPendingIntent(intent);
        setMessages((prev) => [...prev, userMessage, CHECKING_MESSAGE]);
        setInput("");
        return;
      }
    }

    const data: ChatData = {
      stats: statsQuery.data,
      transactionsList: transactionsListQuery.data?.content,
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
    // resize: 브라우저 기본 리사이즈 핸들을 쓴다(우측 하단 모서리, 별도 라이브러리 없음). 이 패널은
    // fixed right-4 bottom-20으로 우하단에 고정돼 있어, 핸들을 당기면 그 모서리를 축으로 왼쪽·위로
    // 늘어난다 — 토글 버튼과 겹치지 않는 방향과 자연히 맞아떨어진다.
    <div className="flex h-[28rem] w-80 min-h-80 max-h-[85vh] min-w-72 max-w-[90vw] resize flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:w-96">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">포켓로그 도우미</p>
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
              {message.lines.map((line, index) => {
                // "전체 보기 → /transactions?..." 형태의 줄만 실제 링크로 바꾼다(buildTransactionsLink 참조).
                const linkMatch = line.match(/^(.+) → (\/\S+)$/);
                if (!linkMatch) return <p key={index}>{line}</p>;
                return (
                  <p key={index}>
                    <Link href={linkMatch[2]} onClick={onClose} className="underline underline-offset-2">
                      {linkMatch[1]}
                    </Link>
                  </p>
                );
              })}
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
