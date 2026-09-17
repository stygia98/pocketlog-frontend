// 의도별로 이미 불러온 데이터(ChatData)에서 필요한 값을 골라 문장으로 포맷한다.
// 금액·날짜 포맷은 lib/money.ts·lib/date.ts만 쓴다(CLAUDE.md 3장·10장) — 새 포맷 함수를 추가하지 않는다.

import { formatDate } from "@/lib/date";
import { formatAmount, formatCompactAmount } from "@/lib/money";
import type { ChatData, ChatIntent } from "@/types/chat";

const HELP_LINES = [
  "이렇게 물어보실 수 있어요.",
  '"이번달 지출 얼마야"',
  '"식비 얼마 썼어" (카테고리 이름으로)',
  '"최근 내역 보여줘"',
  '"예산 얼마 남았어"',
  '"고정지출 뭐있어"',
];

const LOADING = ["아직 데이터를 불러오는 중이에요. 잠시만 기다려 주세요."];

export function buildAnswer(intent: ChatIntent, data: ChatData): string[] {
  switch (intent.type) {
    case "help":
      return HELP_LINES;

    case "monthly_summary": {
      if (!data.stats) return LOADING;
      const { income, expense, net } = data.stats.summary;
      return [`이번 달 총수입 ${formatAmount(income)}원, 총지출 ${formatAmount(expense)}원, 잔액 ${formatAmount(net)}원이에요.`];
    }

    case "category_spend": {
      if (!data.stats) return LOADING;
      const category = data.stats.byCategory.find((c) => c.categoryId === intent.categoryId);
      if (!category) {
        return [`이번 달엔 ${intent.categoryName} 지출 내역이 없어요.`];
      }
      return [
        `이번 달 ${category.name} 지출은 ${formatAmount(category.amount)}원이에요. (전체 지출의 ${Math.round(category.ratio * 100)}%)`,
      ];
    }

    case "recent_transactions": {
      if (!data.recentTransactions) return LOADING;
      if (data.recentTransactions.length === 0) return ["아직 등록된 거래가 없어요."];
      return [
        "최근 거래 내역이에요.",
        ...data.recentTransactions.map((t) => {
          const sign = t.type === "EXPENSE" ? "-" : "+";
          return `${formatDate(t.txnDate)} · ${t.category.name} · ${sign}${formatAmount(t.amount)}원`;
        }),
      ];
    }

    case "budget_status": {
      if (!data.stats) return LOADING;
      const budgeted = data.stats.budgets.filter((b) => b.budget > 0);
      if (budgeted.length === 0) return ["설정된 예산이 없어요."];
      return [
        "이번 달 예산 소진율이에요.",
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
