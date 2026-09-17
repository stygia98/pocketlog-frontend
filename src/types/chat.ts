// 챗봇 위젯 전용 타입. 규칙 기반 의도 매칭 결과와 대화 메시지 형태를 정의한다.

import type { MonthlyStats, Recurring } from "@/types/stats";
import type { Transaction } from "@/types/transaction";

// yearMonth("yyyy-MM")를 들고 있는 3종은 특정 월을 콕 집어 물어봤을 때(예: "9월", "2025년 9월")
// 그 달을 가리킨다. 명시하지 않으면 파싱 시점에 현재 월로 채워진다 — "월 없음" 상태는 없다.
export type ChatIntent =
  | { type: "help" }
  | { type: "monthly_summary"; yearMonth: string }
  | { type: "category_spend"; categoryId: number; categoryName: string; yearMonth: string }
  | { type: "recent_transactions" }
  | { type: "budget_status"; yearMonth: string }
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
