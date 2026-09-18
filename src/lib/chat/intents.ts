// PRD.md 5.1 「챗봇 규칙」 R2(기간 해석)·R3(의도 우선순위)의 구현. LLM을 호출하지 않는다.
// parseIntent의 분기 순서가 곧 R3 표의 순위다 — 순서를 바꾸면 그 표를 먼저 고친다.

import { compact, findCategory, has, hasAny, KW } from "@/lib/chat/matcher";
import {
  daysAgoString,
  formatYearMonth,
  lastWeekRange,
  shiftYearMonth,
  thisWeekRange,
  toDateString,
  todayString,
  yearMonthToRange,
} from "@/lib/date";
import type { ChatIntent, TransactionsListFilters } from "@/types/chat";
import type { Category } from "@/types/transaction";

interface Period {
  from: string;
  to: string;
  label: string;
}

const MONTH = "(0?[1-9]|1[0-2])";
const DAY = "(0?[1-9]|[12]\\d|3[01])";
// 비교 질문에서 문장 속 달 표현을 전부 찾을 때 쓴다(R3-7). 긴 표현부터 적어야 "2025년9월"이 "9월"로 잘리지 않는다.
const MONTH_EXPRESSIONS = new RegExp(
  `지난달|저번달|전월|이번달|이달|\\d{4}년${MONTH}월|(?:작년|올해)${MONTH}월|(?<!\\d)${MONTH}월`,
  "g"
);

// R2. 연도가 없으면 올해, 단 아직 오지 않은 달이면 작년.
function resolveMonth(month: number, currentYearMonth: string, explicitYear?: number): string {
  const [currentYear, currentMonth] = currentYearMonth.split("-").map(Number);
  const year = explicitYear ?? (month > currentMonth ? currentYear - 1 : currentYear);
  return `${year}-${String(month).padStart(2, "0")}`;
}

// R2. 달 표현 하나를 yyyy-MM으로. 날짜 표현에는 오타 보정을 쓰지 않는다(R1-2) — 전부 정규식 정확 일치다.
function findMonth(c: string, currentYearMonth: string): string | undefined {
  if (/지난달|저번달|전월/.test(c)) return shiftYearMonth(currentYearMonth, -1);
  if (/이번달|이달/.test(c)) return currentYearMonth;
  const currentYear = Number(currentYearMonth.slice(0, 4));
  const full = c.match(new RegExp(`(\\d{4})년${MONTH}월`));
  if (full) return resolveMonth(Number(full[2]), currentYearMonth, Number(full[1]));
  const relative = c.match(new RegExp(`(작년|올해)${MONTH}월`));
  if (relative) return resolveMonth(Number(relative[2]), currentYearMonth, currentYear - (relative[1] === "작년" ? 1 : 0));
  const monthOnly = c.match(new RegExp(`(?<!\\d)${MONTH}월`));
  if (monthOnly) return resolveMonth(Number(monthOnly[1]), currentYearMonth);
  return undefined;
}

function makeDate(month: number, day: number, currentYearMonth: string, explicitYear?: number) {
  const [year, resolvedMonth] = resolveMonth(month, currentYearMonth, explicitYear).split("-").map(Number);
  const date = new Date(year, resolvedMonth - 1, day);
  if (date.getMonth() !== resolvedMonth - 1) return undefined; // 2월 30일 같은 없는 날짜
  return { date: toDateString(date), label: `${resolvedMonth}월 ${day}일` };
}

// R2. 하루를 가리키는 표현.
function findDate(c: string, currentYearMonth: string): { date: string; label: string } | undefined {
  if (c.includes("오늘")) return { date: todayString(), label: "오늘" };
  if (c.includes("어제")) return { date: daysAgoString(1), label: "어제" };
  if (c.includes("그제") || c.includes("그저께")) return { date: daysAgoString(2), label: "그제" };
  const full = c.match(new RegExp(`(\\d{4})년${MONTH}월${DAY}일`));
  if (full) return makeDate(Number(full[2]), Number(full[3]), currentYearMonth, Number(full[1]));
  const monthDay = c.match(new RegExp(`(?<!\\d)${MONTH}월${DAY}일`));
  if (monthDay) return makeDate(Number(monthDay[1]), Number(monthDay[2]), currentYearMonth);
  return undefined;
}

// R2. 목록 질문의 조회 구간. 못 찾으면 undefined — 호출자가 전체 기간(또는 기본 구간)으로 채운다.
function findPeriod(c: string, currentYearMonth: string): Period | undefined {
  const day = findDate(c, currentYearMonth);
  if (day) return { from: day.date, to: day.date, label: day.label };
  if (c.includes("지난주")) return { ...lastWeekRange(), label: "지난주" };
  if (c.includes("이번주")) return { ...thisWeekRange(), label: "이번주" };
  const recent = c.match(/최근(\d{1,3})일/);
  if (recent) {
    const n = Math.max(1, Number(recent[1]));
    return { from: daysAgoString(n - 1), to: todayString(), label: `최근 ${n}일` };
  }
  const yearMonth = findMonth(c, currentYearMonth);
  if (yearMonth) return { ...yearMonthToRange(yearMonth), label: formatYearMonth(yearMonth) };
  return undefined;
}

// R3-7. "X보다"의 X가 기준 달, 없으면 달 두 개(앞이 기준), 하나면 그 전달이 기준.
function findCompareMonths(c: string, currentYearMonth: string): { target: string; base: string } {
  const found = [...c.matchAll(MONTH_EXPRESSIONS)].map((match) => ({
    yearMonth: findMonth(match[0], currentYearMonth) ?? currentYearMonth,
    isBase: c.startsWith("보다", (match.index ?? 0) + match[0].length),
  }));
  const baseHit = found.find((f) => f.isBase);
  if (baseHit) {
    const target = found.find((f) => f !== baseHit)?.yearMonth ?? currentYearMonth;
    return { target, base: baseHit.yearMonth === target ? shiftYearMonth(target, -1) : baseHit.yearMonth };
  }
  if (found.length >= 2) return { base: found[0].yearMonth, target: found[1].yearMonth };
  const target = found[0]?.yearMonth ?? currentYearMonth;
  return { target, base: shiftYearMonth(target, -1) };
}

// R3-9. 따옴표로 감싼 말, 또는 "X에서"의 X. 기간 표현은 거래처로 보지 않는다.
function findMerchant(text: string): string | undefined {
  const quoted = text.match(/["'“”‘’「『]([^"'“”‘’」』]+)["'“”‘’」』]/);
  if (quoted) return quoted[1].trim() || undefined;
  const at = text.match(/([가-힣A-Za-z0-9&]+)\s*에서/);
  if (at && !/^(이번달|지난달|저번달|이달|오늘|어제|그제|이번주|지난주|최근|\d+월|\d+일)$/.test(at[1])) return at[1];
  return undefined;
}

// R3-9~12의 목록 의도. 합계를 물으면 20건까지 받아와 합산하되 표시는 displayLimit만큼(R4-9).
function listIntent(c: string, currentYearMonth: string, extra: Partial<TransactionsListFilters>, fallback?: Period): ChatIntent {
  const wantsExpense = hasAny(c, KW.expense) && !hasAny(c, KW.income);
  const wantsIncome = hasAny(c, KW.income) && !hasAny(c, KW.expense);
  const period = findPeriod(c, currentYearMonth) ?? fallback;
  const wantsSum = extra.wantsSum ?? hasAny(c, KW.amount);
  const limit = c.match(/(\d{1,2})건/);
  const displayLimit = limit ? Math.min(Math.max(Number(limit[1]), 1), 20) : 5;
  return {
    type: "transactions_list",
    filters: {
      size: wantsSum ? 20 : displayLimit,
      type: wantsExpense ? "EXPENSE" : wantsIncome ? "INCOME" : undefined,
      from: period?.from,
      to: period?.to,
      periodLabel: period?.label ?? "전체 기간",
      displayLimit,
      ...extra,
      wantsSum,
    },
  };
}

export function parseIntent(text: string, categories: Category[], currentYearMonth: string): ChatIntent {
  const raw = text.trim();
  if (!raw) return { type: "unknown" };
  const c = compact(raw);
  const active = categories.filter((category) => !category.deleted);
  const category = findCategory(c, active);
  const expenseCategory = category?.type === "EXPENSE" ? category : undefined;

  // 1. 도움말
  if (hasAny(c, KW.help)) return { type: "help" };

  // 2. 미래 달·날짜
  const yearMonth = findMonth(c, currentYearMonth) ?? currentYearMonth;
  const date = findDate(c, currentYearMonth);
  if (yearMonth > currentYearMonth) return { type: "future", label: formatYearMonth(yearMonth) };
  if (date && date.date > todayString()) return { type: "future", label: date.label };
  const isCurrentMonth = yearMonth === currentYearMonth;

  // 3. 고정지출
  if (hasAny(c, KW.recurring)) return { type: "recurring" };

  // 4. 예산
  if (hasAny(c, KW.budget)) {
    return { type: "budget_status", yearMonth, categoryId: expenseCategory?.id, categoryName: expenseCategory?.name };
  }

  // 5. 예상 지출
  if (hasAny(c, KW.forecast)) return { type: "forecast", yearMonth, isCurrentMonth };

  // 6. 평소 대비 이상치 — "평소보다"가 7의 "보다"에 먹히지 않게 비교보다 먼저 본다.
  if (hasAny(c, KW.anomaly)) return { type: "anomalies", yearMonth };

  // 7. 두 달 비교
  if (hasAny(c, KW.compare)) {
    const { target, base } = findCompareMonths(c, currentYearMonth);
    return {
      type: "compare",
      yearMonth: target,
      baseYearMonth: base,
      isCurrentMonth: target === currentYearMonth,
      categoryId: expenseCategory?.id,
      categoryName: expenseCategory?.name,
    };
  }

  // 8. 지출 순위
  if (hasAny(c, KW.top)) return { type: "top_categories", yearMonth };

  // 9. 거래처 검색 — 이름이 카테고리면 카테고리 규칙으로 넘긴다.
  const merchant = findMerchant(raw);
  if (merchant && !findCategory(compact(merchant), active)) {
    return listIntent(c, currentYearMonth, { keyword: merchant, scopeLabel: `"${merchant}"` });
  }

  // 10. 거래 목록
  if (hasAny(c, KW.list) || (has(c, "최근") && hasAny(c, KW.show))) {
    return listIntent(c, currentYearMonth, { categoryId: category?.id, categoryName: category?.name });
  }

  // 11. 수입 카테고리 — 월별 통계의 카테고리 집계는 지출 전용이라 목록+합계로 답한다.
  if (category?.type === "INCOME") {
    const month = { ...yearMonthToRange(yearMonth), label: formatYearMonth(yearMonth) };
    return listIntent(c, currentYearMonth, { categoryId: category.id, categoryName: category.name, wantsSum: true }, month);
  }

  // 12. 하루 지출 — 카테고리를 함께 말하면 그날·그 카테고리의 목록+합계.
  if (date && expenseCategory) {
    return listIntent(c, currentYearMonth, { categoryId: expenseCategory.id, categoryName: expenseCategory.name, wantsSum: true });
  }
  if (date && hasAny(c, KW.spend)) return { type: "daily_spend", date: date.date, yearMonth: date.date.slice(0, 7) };

  // 13. 카테고리 지출 — 이름만 말해도 인정("9월 식비").
  if (expenseCategory) {
    return { type: "category_spend", categoryId: expenseCategory.id, categoryName: expenseCategory.name, yearMonth };
  }

  // 14. 월 요약 — "얼마" 단독으로는 걸리지 않는다.
  if (hasAny(c, KW.summary)) {
    const wantsExpense = hasAny(c, KW.expense);
    const wantsIncome = hasAny(c, KW.income);
    const wantsNet = hasAny(c, KW.net);
    const picked = [wantsExpense && "expense", wantsIncome && "income", wantsNet && "net"].filter(Boolean);
    const metric = picked.length === 1 ? (picked[0] as "expense" | "income" | "net") : undefined;
    return { type: "monthly_summary", yearMonth, metric };
  }

  return { type: "unknown" };
}
