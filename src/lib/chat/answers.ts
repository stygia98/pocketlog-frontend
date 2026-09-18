// 의도별로 이미 불러온 데이터(ChatData)에서 필요한 값을 골라 문장으로 포맷한다.
// 금액·날짜 포맷은 lib/money.ts·lib/date.ts만 쓴다(CLAUDE.md 3장·10장) — 새 포맷 함수를 추가하지 않는다.

import { formatDate, formatYearMonth } from "@/lib/date";
import { formatAmount, formatCompactAmount } from "@/lib/money";
import type { ChatData, ChatIntent, TransactionsListFilters } from "@/types/chat";

const HELP_LINES = [
  "이렇게 물어보실 수 있어요.",
  '"이번달 지출 얼마야" / "지출만 얼마야" / "9월 수입 얼마야"',
  '"식비 얼마 썼어" (카테고리 이름으로, 월을 붙여도 돼요)',
  '"지출 내역 보여줘" / "이번주 수입 리스트" / "최근 7일 내역 10건"',
  '"예산 얼마 남았어"',
  '"고정지출 뭐있어"',
];

const LOADING = ["아직 데이터를 불러오는 중이에요. 잠시만 기다려 주세요."];

// 목록 답변 끝에 붙이는 딥링크. 챗봇 안에서 페이지네이션·정렬을 재구현하지 않고
// 이미 있는 /transactions 화면으로 필터를 그대로 넘긴다(CLAUDE.md 5장 쿼리 파라미터와 동일한 이름).
function buildTransactionsLink(filters: TransactionsListFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.categoryId) params.set("categoryId", String(filters.categoryId));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function buildAnswer(intent: ChatIntent, data: ChatData): string[] {
  switch (intent.type) {
    case "help":
      return HELP_LINES;

    case "monthly_summary": {
      if (!data.stats) return LOADING;
      const { income, expense, net } = data.stats.summary;
      const monthLabel = formatYearMonth(data.stats.yearMonth);
      if (intent.metric === "expense") return [`${monthLabel} 총지출은 ${formatAmount(expense)}원이에요.`];
      if (intent.metric === "income") return [`${monthLabel} 총수입은 ${formatAmount(income)}원이에요.`];
      if (intent.metric === "net") return [`${monthLabel} 잔액은 ${formatAmount(net)}원이에요.`];
      return [
        `${monthLabel} 총수입 ${formatAmount(income)}원, 총지출 ${formatAmount(expense)}원, 잔액 ${formatAmount(net)}원이에요.`,
      ];
    }

    case "category_spend": {
      if (!data.stats) return LOADING;
      const monthLabel = formatYearMonth(data.stats.yearMonth);
      const category = data.stats.byCategory.find((c) => c.categoryId === intent.categoryId);
      if (!category) {
        return [`${monthLabel}엔 ${intent.categoryName} 지출 내역이 없어요.`];
      }
      return [
        `${monthLabel} ${category.name} 지출은 ${formatAmount(category.amount)}원이에요. (전체 지출의 ${Math.round(category.ratio * 100)}%)`,
      ];
    }

    case "transactions_list": {
      if (!data.transactionsList) return LOADING;
      const { filters } = intent;
      const scopeLabel = [
        filters.periodLabel,
        filters.categoryName,
        filters.type === "EXPENSE" ? "지출" : filters.type === "INCOME" ? "수입" : undefined,
      ]
        .filter(Boolean)
        .join(" ");

      if (data.transactionsList.length === 0) {
        return [`${scopeLabel} 내역이 없어요.`];
      }

      return [
        `${scopeLabel} 내역이에요.`,
        ...data.transactionsList.map((t) => {
          const sign = t.type === "EXPENSE" ? "-" : "+";
          return `${formatDate(t.txnDate)} · ${t.category.name} · ${sign}${formatAmount(t.amount)}원`;
        }),
        `전체 보기 → ${buildTransactionsLink(filters)}`,
      ];
    }

    case "budget_status": {
      if (!data.stats) return LOADING;
      const budgeted = data.stats.budgets.filter((b) => b.budget > 0);
      if (budgeted.length === 0) return ["설정된 예산이 없어요."];
      return [
        `${formatYearMonth(data.stats.yearMonth)} 예산 소진율이에요.`,
        ...budgeted.map((b) => {
          const ratio = Math.round(b.usageRatio * 100);
          const suffix = b.exceeded ? " — 초과!" : "";
          return `${b.name} · ${formatAmount(b.spent)}원 / ${formatAmount(b.budget)}원 (${ratio}%)${suffix}`;
        }),
      ];
    }

    case "recurring": {
      if (!data.recurring) return LOADING;
      if (data.recurring.length === 0) return ["아직 고정지출로 보이는 내역이 없어요."];
      return [
        "고정지출로 보이는 내역이에요.",
        ...data.recurring.map((r) => `${r.merchant} · ${formatCompactAmount(r.medianAmount)} · ${r.monthsSeen}개월 연속`),
      ];
    }

    case "unknown":
    default:
      return ["질문을 이해하지 못했어요.", ...HELP_LINES];
  }
}
