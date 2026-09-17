// 챗봇 위젯 전용 타입. 규칙 기반 의도 매칭 결과와 대화 메시지 형태를 정의한다.

import type { MonthlyStats, Recurring } from "@/types/stats";
import type { Transaction } from "@/types/transaction";

export type ChatIntent =
  | { type: "help" }
  | { type: "monthly_summary" }
  | { type: "category_spend"; categoryId: number; categoryName: string }
  | { type: "recent_transactions" }
  | { type: "budget_status" }
  | { type: "recurring" }
  | { type: "unknown" };

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  lines: string[];
}

// ChatPanel이 이미 불러온 4개 쿼리 결과를 답변 생성 함수에 그대로 넘기기 위한 묶음.
// 아직 로딩 중인 항목은 undefined다.
export interface ChatData {
  stats: MonthlyStats | undefined;
  recentTransactions: Transaction[] | undefined;
  recurring: Recurring[] | undefined;
}
