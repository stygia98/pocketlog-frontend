// 챗봇 위젯 전용 타입. 규칙 기반 의도 매칭 결과와 대화 메시지 형태를 정의한다.

import type { TransactionListParams } from "@/lib/queryKeys";
import type { MonthlyStats, Recurring } from "@/types/stats";
import type { Transaction } from "@/types/transaction";

// yearMonth("yyyy-MM")를 들고 있는 3종은 특정 월을 콕 집어 물어봤을 때(예: "9월", "2025년 9월")
// 그 달을 가리킨다. 명시하지 않으면 파싱 시점에 현재 월로 채워진다 — "월 없음" 상태는 없다.
// metric이 없는 monthly_summary는 수입·지출·잔액 셋 다 답한다("지출만"처럼 하나만 짚었을 때만 채워진다).
export type ChatIntent =
  | { type: "help" }
  | { type: "monthly_summary"; yearMonth: string; metric?: "income" | "expense" | "net" }
  | { type: "category_spend"; categoryId: number; categoryName: string; yearMonth: string }
  | { type: "transactions_list"; filters: TransactionsListFilters }
  | { type: "budget_status"; yearMonth: string }
  | { type: "recurring" }
  | { type: "unknown" };

// "내역"/"리스트"/"목록" 계열 질문이 뽑아낸 필터. size 외 나머지는 TransactionListParams와
// 그대로 대응한다 — periodLabel·categoryName은 쿼리엔 안 쓰이고 답변 문구 조립에만 쓴다.
export type TransactionsListFilters = Omit<TransactionListParams, "page"> & {
  periodLabel: string;
  categoryName?: string;
};

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  lines: string[];
}

// ChatPanel이 이미 불러온 4개 쿼리 결과를 답변 생성 함수에 그대로 넘기기 위한 묶음.
// 아직 로딩 중인 항목은 undefined다.
export interface ChatData {
  stats: MonthlyStats | undefined;
  transactionsList: Transaction[] | undefined;
  recurring: Recurring[] | undefined;
}
