// 규칙 기반 키워드 매칭. 우선순위 목록을 위에서부터 검사해 먼저 맞는 것을 쓴다.
// LLM을 호출하지 않는다 — CLAUDE.md 3장 "불필요한 의존성 추가 안 함" 기조, PRD 3.8 CHAT-01~05.

import type { ChatIntent } from "@/types/chat";
import type { Category } from "@/types/transaction";

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function parseIntent(text: string, categories: Category[]): ChatIntent {
  const normalized = text.trim();
  if (normalized.length === 0) return { type: "unknown" };

  if (includesAny(normalized, ["도움", "뭐 할 수", "무엇을 할 수", "help"])) {
    return { type: "help" };
  }

  if (includesAny(normalized, ["고정지출", "정기결제", "구독"])) {
    return { type: "recurring" };
  }

  if (normalized.includes("예산") && includesAny(normalized, ["얼마", "남았", "소진"])) {
    return { type: "budget_status" };
  }

  if (includesAny(normalized, ["최근", "내역"]) && includesAny(normalized, ["보여", "뭐", "조회"])) {
    return { type: "recent_transactions" };
  }

  // 삭제된 카테고리는 새 조회 대상에서 제외한다(CAT-03 — 과거 내역엔 남지만 선택지엔 안 나옴).
  const matchedCategory = categories
    .filter((c) => c.type === "EXPENSE" && !c.deleted)
    .find((c) => normalized.includes(c.name));
  if (matchedCategory && includesAny(normalized, ["얼마", "썼", "지출", "쓴"])) {
    return { type: "category_spend", categoryId: matchedCategory.id, categoryName: matchedCategory.name };
  }

  if (includesAny(normalized, ["이번달", "이번 달"]) && includesAny(normalized, ["지출", "수입", "잔액", "얼마"])) {
    return { type: "monthly_summary" };
  }

  return { type: "unknown" };
}
