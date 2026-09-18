// 챗봇 위젯 전용 타입. 규칙 기반 의도 매칭 결과와 대화 메시지 형태를 정의한다.
// 의도 종류·우선순위의 정본은 PRD.md 5.1 「챗봇 규칙」 R3이다.

import type { TransactionListParams } from "@/lib/queryKeys";
import type { MonthlyStats, Recurring } from "@/types/stats";
import type { Transaction } from "@/types/transaction";

// yearMonth("yyyy-MM")는 파싱 시점에 항상 채워진다(R2 — 언급이 없으면 이번 달). "월 없음" 상태는 없다.
export type ChatIntent =
  | { type: "help" }
  | { type: "future"; label: string }
  | { type: "recurring" }
  | { type: "budget_status"; yearMonth: string; categoryId?: number; categoryName?: string }
  | { type: "forecast"; yearMonth: string; isCurrentMonth: boolean }
  | { type: "anomalies"; yearMonth: string }
  | {
      type: "compare";
      yearMonth: string;
      baseYearMonth: string;
      isCurrentMonth: boolean;
      categoryId?: number;
      categoryName?: string;
    }
  | { type: "top_categories"; yearMonth: string }
  | { type: "transactions_list"; filters: TransactionsListFilters }
  | { type: "daily_spend"; date: string; yearMonth: string }
  | { type: "category_spend"; categoryId: number; categoryName: string; yearMonth: string }
  | { type: "monthly_summary"; yearMonth: string; metric?: "income" | "expense" | "net" }
  | { type: "unknown" };

// 목록 계열 질문이 뽑아낸 필터. TransactionListParams와 대응하는 필드만 쿼리에 쓰이고,
// periodLabel·categoryName·scopeLabel·wantsSum은 답변 문구 조립에만 쓴다.
export type TransactionsListFilters = Omit<TransactionListParams, "page"> & {
  periodLabel: string;
  categoryName?: string;
  /** 거래처 검색일 때 첫 줄에 보여줄 검색어(R4-1). */
  scopeLabel?: string;
  /** "얼마"·"합계"처럼 금액을 물었으면 목록 합계를 함께 답한다(R4-7). */
  wantsSum: boolean;
  /** 화면에 보여줄 줄 수. 합계용으로 size를 20까지 늘려도 표시는 이만큼만 한다(R4-9). */
  displayLimit: number;
};

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  lines: string[];
}

// ChatPanel이 이미 불러온 쿼리 결과를 답변 생성 함수에 그대로 넘기기 위한 묶음. 로딩 중이면 undefined.
export interface ChatData {
  stats: MonthlyStats | undefined;
  /** 비교(compare) 의도의 기준 달 통계. */
  baseStats: MonthlyStats | undefined;
  transactionsList: Transaction[] | undefined;
  /** 목록 쿼리의 전체 건수 — 받아온 건수보다 많으면 "전체 N건 중"을 밝힌다(R4-6·7). */
  transactionsTotal: number | undefined;
  recurring: Recurring[] | undefined;
}
