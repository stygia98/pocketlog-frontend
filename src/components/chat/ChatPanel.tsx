"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategoriesQuery } from "@/hooks/useCategories";
import { useMonthlyStatsQuery, useRecurringQuery } from "@/hooks/useStats";
import { useTransactionListQuery } from "@/hooks/useTransactions";
import { buildAnswer, LOAD_FAILED } from "@/lib/chat/answers";
import { parseIntent } from "@/lib/chat/intents";
import { shiftYearMonth, todayString, toYearMonthString } from "@/lib/date";
import type { TransactionListParams } from "@/lib/queryKeys";
import type { ChatData, ChatIntent, ChatMessage, TransactionsListFilters } from "@/types/chat";

const DEFAULT_LIST_FILTERS: TransactionListParams = { page: 0, size: 5 };

interface ChatPanelProps {
  onClose: () => void;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "bot",
  lines: ["안녕하세요! 지출·수입, 카테고리, 예상 지출, 지난달 비교, 거래처 검색, 예산, 고정지출을 물어보세요. \"도움\"이라고 치면 예시를 보여드려요."],
};

const CHECKING_MESSAGE: ChatMessage = { id: "checking", role: "bot", lines: ["확인하고 있어요..."] };

// 의도별로 답하기 전에 준비돼 있어야 하는 조회. 값이 현재 상태와 다르면 상태를 바꿔 다시 불러온다.
interface Needs {
  yearMonth?: string;
  baseYearMonth?: string;
  list?: TransactionListParams;
  recurring?: boolean;
}

function toListParams(filters: TransactionsListFilters): TransactionListParams {
  return {
    page: 0,
    size: filters.size,
    type: filters.type,
    categoryId: filters.categoryId,
    from: filters.from,
    to: filters.to,
    keyword: filters.keyword,
  };
}

function needsOf(intent: ChatIntent): Needs {
  switch (intent.type) {
    case "monthly_summary":
    case "category_spend":
    case "budget_status":
    case "forecast":
    case "anomalies":
    case "top_categories":
    case "daily_spend":
      return { yearMonth: intent.yearMonth };
    case "compare":
      return { yearMonth: intent.yearMonth, baseYearMonth: intent.baseYearMonth };
    case "transactions_list":
      return { list: toListParams(intent.filters) };
    case "recurring":
      return { recurring: true };
    default:
      return {};
  }
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
  // 질문에서 다른 달(예: "9월", "지난달")을 언급하면 이 값을 그 달로 바꿔 다시 조회한다.
  const [targetYearMonth, setTargetYearMonth] = useState(currentYearMonth);
  // 비교 질문의 기준 달. 비교가 가장 흔히 묻는 "지난달"로 미리 받아둔다(대시보드가 이미 캐시했을 가능성도 높다).
  const [baseYearMonth, setBaseYearMonth] = useState(() => shiftYearMonth(currentYearMonth, -1));
  // 목록류 질문이 요청한 필터. 기본값은 "최근 5건".
  const [listFilters, setListFilters] = useState<TransactionListParams>(DEFAULT_LIST_FILTERS);
  const [pendingIntent, setPendingIntent] = useState<ChatIntent | null>(null);

  const asOf = todayString();

  const categoriesQuery = useCategoriesQuery();
  const statsQuery = useMonthlyStatsQuery(targetYearMonth, asOf);
  const baseStatsQuery = useMonthlyStatsQuery(baseYearMonth, asOf);
  const transactionsListQuery = useTransactionListQuery(listFilters);
  const recurringQuery = useRecurringQuery(asOf);

  const isReady =
    !categoriesQuery.isLoading &&
    !statsQuery.isLoading &&
    !baseStatsQuery.isLoading &&
    !transactionsListQuery.isLoading &&
    !recurringQuery.isLoading;

  const currentData = (): ChatData => ({
    stats: statsQuery.data,
    baseStats: baseStatsQuery.data,
    transactionsList: transactionsListQuery.data?.content,
    transactionsTotal: transactionsListQuery.data?.totalElements,
    recurring: recurringQuery.data,
  });

  // R4-10. 필요한 조회 중 하나라도 실패했으면 대기하지 않고 실패로 끝낸다.
  const hasFailed = (needs: Needs) =>
    (needs.yearMonth !== undefined && statsQuery.isError) ||
    (needs.baseYearMonth !== undefined && baseStatsQuery.isError) ||
    (needs.list !== undefined && transactionsListQuery.isError) ||
    (needs.recurring === true && recurringQuery.isError);

  const answer = (intent: ChatIntent): string[] => (hasFailed(needsOf(intent)) ? LOAD_FAILED : buildAnswer(intent, currentData()));

  // 상태를 바꾼 직후엔 쿼리가 새 키로 넘어가 data가 비거나 이전 달 값이다. 필요한 값이
  // "바로 그 달·그 필터"의 결과가 됐을 때만 답한다 — yearMonth는 응답에 실려 오므로 직접 대조한다.
  useEffect(() => {
    if (!pendingIntent) return;
    const needs = needsOf(pendingIntent);
    if (!hasFailed(needs)) {
      if (needs.yearMonth && statsQuery.data?.yearMonth !== needs.yearMonth) return;
      if (needs.baseYearMonth && baseStatsQuery.data?.yearMonth !== needs.baseYearMonth) return;
      if (needs.list && (transactionsListQuery.isLoading || !transactionsListQuery.data)) return;
    }
    setMessages((prev) => [
      ...prev.slice(0, -1), // "확인하고 있어요..." 자리를 실제 답으로 교체
      { id: crypto.randomUUID(), role: "bot", lines: answer(pendingIntent) },
    ]);
    setPendingIntent(null);
    // answer/hasFailed는 아래 쿼리 상태에서 파생되므로 그 상태들만 의존성으로 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pendingIntent,
    statsQuery.data,
    statsQuery.isError,
    baseStatsQuery.data,
    baseStatsQuery.isError,
    transactionsListQuery.data,
    transactionsListQuery.isLoading,
    transactionsListQuery.isError,
    recurringQuery.isError,
  ]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || pendingIntent) return;

    const intent = parseIntent(text, categoriesQuery.data ?? [], currentYearMonth);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", lines: [text] };
    const needs = needsOf(intent);

    // 지금 들고 있는 조회로 답할 수 없으면 상태를 바꿔 다시 불러오고, 그동안 대기 메시지를 띄운다.
    let mustWait = false;
    if (needs.yearMonth && needs.yearMonth !== targetYearMonth) {
      setTargetYearMonth(needs.yearMonth);
      mustWait = true;
    }
    if (needs.baseYearMonth && needs.baseYearMonth !== baseYearMonth) {
      setBaseYearMonth(needs.baseYearMonth);
      mustWait = true;
    }
    if (needs.list && JSON.stringify(needs.list) !== JSON.stringify(listFilters)) {
      setListFilters(needs.list);
      mustWait = true;
    }
    setInput("");

    if (mustWait) {
      setPendingIntent(intent);
      setMessages((prev) => [...prev, userMessage, CHECKING_MESSAGE]);
      return;
    }
    setMessages((prev) => [...prev, userMessage, { id: crypto.randomUUID(), role: "bot", lines: answer(intent) }]);
  };

  // 좌상단 핸들 드래그로 크기를 바꾼다. 브라우저 기본 `resize`는 우하단 핸들만 지원해 직접 구현한다.
  // 패널이 우하단에 고정돼 있어 왼쪽·위로 당기면 커지고, 최소·최대는 CSS(min/max-*)가 잡아준다.
  const panelRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    event.preventDefault();
    const { offsetWidth: startW, offsetHeight: startH } = panel;
    const { left, top } = panel.getBoundingClientRect();
    const { clientX: startX, clientY: startY } = event;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);

    // 위젯을 옮길 수 있으므로, 커지다가 화면 왼쪽·위로 넘치지 않게 여백 8px까지만 허용한다.
    const onMove = (e: globalThis.PointerEvent) =>
      setSize({
        width: Math.min(startW + (startX - e.clientX), startW + left - 8),
        height: Math.min(startH + (startY - e.clientY), startH + top - 8),
      });
    const onEnd = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  };

  return (
    <div
      ref={panelRef}
      style={size ?? undefined}
      className="relative flex h-[28rem] w-80 min-h-80 max-h-[85vh] min-w-72 max-w-[90vw] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:w-96"
    >
      <div
        onPointerDown={startResize}
        aria-hidden
        title="끌어서 크기 조절"
        className="absolute top-0 left-0 z-10 flex size-6 cursor-nwse-resize touch-none items-start justify-start p-1 text-muted-foreground/60 hover:text-foreground pointer-coarse:size-9"
      >
        {/* 좌상단 모서리를 가리키는 두 줄 그립 */}
        <svg viewBox="0 0 10 10" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 9 9 1M1 5 5 1" />
        </svg>
      </div>
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
