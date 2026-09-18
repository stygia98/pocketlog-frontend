// 규칙 기반 키워드 매칭. 우선순위 목록을 위에서부터 검사해 먼저 맞는 것을 쓴다.
// LLM을 호출하지 않는다 — CLAUDE.md 3장 "불필요한 의존성 추가 안 함" 기조, PRD 3.8 CHAT-01~05.

import { daysAgoString, formatYearMonth, lastWeekRange, thisWeekRange, todayString, yearMonthToRange } from "@/lib/date";
import type { ChatIntent } from "@/types/chat";
import type { Category } from "@/types/transaction";

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

// "2025년 9월", "9월"처럼 문장에 박힌 월 표현을 yyyy-MM로 뽑아낸다. 못 찾으면 undefined —
// 호출자가 현재 월로 기본값을 채운다. "3개월"처럼 숫자와 월 사이에 다른 글자가 끼면 매칭하지 않는다.
function extractYearMonth(text: string, defaultYearMonth: string): string | undefined {
  const withYear = text.match(/(\d{4})\s*년\s*(0?[1-9]|1[0-2])\s*월/);
  if (withYear) {
    return `${withYear[1]}-${withYear[2].padStart(2, "0")}`;
  }
  const monthOnly = text.match(/(0?[1-9]|1[0-2])\s*월/);
  if (monthOnly) {
    const year = defaultYearMonth.slice(0, 4);
    return `${year}-${monthOnly[1].padStart(2, "0")}`;
  }
  return undefined;
}

// "내역"류 질문에서 기간을 뽑는다. monthly_summary(월 단위 통계 API)와 달리 이쪽은 임의 구간을
// from/to로 표현할 수 있어야 하므로 extractYearMonth보다 표현이 넓다. 못 찾으면 undefined —
// 호출자가 "전체 기간"(from/to 없음)으로 취급한다. 우선순위: 상대 표현 → 명시적 월.
function extractPeriod(text: string, defaultYearMonth: string): { from?: string; to?: string; label: string } | undefined {
  if (text.includes("오늘")) {
    const today = todayString();
    return { from: today, to: today, label: "오늘" };
  }
  if (text.includes("어제")) {
    const yesterday = daysAgoString(1);
    return { from: yesterday, to: yesterday, label: "어제" };
  }
  if (includesAny(text, ["지난주", "지난 주"])) {
    return { ...lastWeekRange(), label: "지난주" };
  }
  if (includesAny(text, ["이번주", "이번 주"])) {
    return { ...thisWeekRange(), label: "이번주" };
  }
  const recentDays = text.match(/최근\s*(\d{1,3})\s*일/);
  if (recentDays) {
    const n = Number(recentDays[1]);
    return { from: daysAgoString(n - 1), to: todayString(), label: `최근 ${n}일` };
  }
  const yearMonth = extractYearMonth(text, defaultYearMonth);
  if (yearMonth) {
    return { ...yearMonthToRange(yearMonth), label: formatYearMonth(yearMonth) };
  }
  return undefined;
}

export function parseIntent(text: string, categories: Category[], defaultYearMonth: string): ChatIntent {
  const normalized = text.trim();
  if (normalized.length === 0) return { type: "unknown" };

  const yearMonth = extractYearMonth(normalized, defaultYearMonth) ?? defaultYearMonth;

  if (includesAny(normalized, ["도움", "뭐 할 수", "무엇을 할 수", "help"])) {
    return { type: "help" };
  }

  if (includesAny(normalized, ["고정지출", "정기결제", "구독"])) {
    return { type: "recurring" };
  }

  if (normalized.includes("예산") && includesAny(normalized, ["얼마", "남았", "소진"])) {
    return { type: "budget_status", yearMonth };
  }

  // "내역"/"리스트"/"목록"은 그 자체로 목록 요청이다. "최근"은 "보여/뭐/조회"가 붙어야 목록으로 본다
  // ("최근 3개월"처럼 기간 표현으로만 쓰이는 경우와 구분하기 위함).
  const isListRequest =
    includesAny(normalized, ["내역", "리스트", "목록"]) ||
    (normalized.includes("최근") && includesAny(normalized, ["보여", "뭐", "조회"]));
  if (isListRequest) {
    const wantsExpense = normalized.includes("지출") && !normalized.includes("수입");
    const wantsIncome = normalized.includes("수입") && !normalized.includes("지출");
    const type = wantsExpense ? "EXPENSE" : wantsIncome ? "INCOME" : undefined;

    // 목록은 삭제 여부와 무관하게 언급된 카테고리를 찾는다(category_spend와 달리 지출로 한정하지 않음).
    const matchedCategory = categories.filter((c) => !c.deleted).find((c) => normalized.includes(c.name));

    const period = extractPeriod(normalized, defaultYearMonth);

    const limitMatch = normalized.match(/(\d{1,2})\s*건/);
    const size = limitMatch ? Math.min(Number(limitMatch[1]), 20) : 5;

    return {
      type: "transactions_list",
      filters: {
        size,
        type,
        categoryId: matchedCategory?.id,
        categoryName: matchedCategory?.name,
        from: period?.from,
        to: period?.to,
        periodLabel: period?.label ?? "전체",
      },
    };
  }

  // 삭제된 카테고리는 새 조회 대상에서 제외한다(CAT-03 — 과거 내역엔 남지만 선택지엔 안 나옴).
  const matchedCategory = categories
    .filter((c) => c.type === "EXPENSE" && !c.deleted)
    .find((c) => normalized.includes(c.name));
  if (matchedCategory && includesAny(normalized, ["얼마", "썼", "지출", "쓴"])) {
    return { type: "category_spend", categoryId: matchedCategory.id, categoryName: matchedCategory.name, yearMonth };
  }

  // "이번달"/명시적 월 언급이 없어도(예: "지출만 얼마야") 지출·수입·잔액·총·금액 중 하나만
  // 있으면 요약으로 본다 — yearMonth는 이미 위에서 현재 달로 기본값이 채워져 있다.
  // "얼마"만 단독으로는 트리거하지 않는다("이거 얼마야"처럼 무관한 문장의 오탐을 막기 위함).
  if (includesAny(normalized, ["지출", "수입", "잔액", "총", "금액"])) {
    // 지출/수입/잔액 중 하나만 짚었으면 그 값만 답한다("지출만 얼마야"). 둘 이상 섞였거나
    // "총"/"금액"처럼 특정하지 않았으면 metric을 비워 기존처럼 셋 다 답한다.
    const wantsExpense = normalized.includes("지출");
    const wantsIncome = normalized.includes("수입");
    const wantsNet = normalized.includes("잔액");
    const metric =
      wantsExpense && !wantsIncome && !wantsNet
        ? "expense"
        : wantsIncome && !wantsExpense && !wantsNet
          ? "income"
          : wantsNet && !wantsExpense && !wantsIncome
            ? "net"
            : undefined;
    return { type: "monthly_summary", yearMonth, metric };
  }

  return { type: "unknown" };
}
