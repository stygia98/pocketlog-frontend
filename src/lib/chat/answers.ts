// PRD.md 5.1 「챗봇 규칙」 R4(답변 규칙)의 구현. 이미 불러온 데이터(ChatData)를 문장으로 바꾼다.
// 예측·이상치 값은 서버 응답을 그대로 쓰고, 직접 하는 계산은 두 달 차이·목록 합계뿐이다(PRD 3.8).
// 금액·날짜 포맷은 lib/money.ts·lib/date.ts만 쓴다(CLAUDE.md 10장).

import { formatDate, formatYearMonth, todayString } from "@/lib/date";
import { formatAmount } from "@/lib/money";
import type { ChatData, ChatIntent, TransactionsListFilters } from "@/types/chat";
import type { MonthlyStats } from "@/types/stats";

export const HELP_LINES = [
  "이렇게 물어보실 수 있어요.",
  '"이번달 지출 얼마야" / "지난달 수입" / "9월 잔액"',
  '"식비 얼마 썼어" / "9월 식비" / "통신비 얼마"',
  '"이번달 예상 지출" / "평소보다 많이 쓴 거 있어?"',
  '"제일 많이 쓴 카테고리" / "지난달보다 얼마나 더 썼어"',
  '"오늘 얼마 썼어" / "9월 14일 지출" / "어제 식비"',
  '"스타벅스에서 얼마 썼어" / "최근 7일 지출 내역 10건"',
  '"예산 얼마 남았어" / "고정지출 뭐있어"',
];

const LOADING = ["아직 데이터를 불러오는 중이에요. 잠시만 기다려 주세요."];
export const LOAD_FAILED = ["데이터를 불러오지 못했어요. 잠시 후 다시 물어봐 주세요."];

const won = (value: number) => `${formatAmount(value)}원`;
const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

// "yyyy-MM-dd" → "9월 14일"
function dayLabel(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}월 ${day}일`;
}

// R4-2·5. 증감은 부호 대신 "늘었어요/줄었어요"로 쓰고, 기준이 0이면 비율을 계산하지 않는다.
function describeChange(current: number, base: number, baseLabel: string): string {
  if (base === 0) return current === 0 ? `${baseLabel}과 마찬가지로 기록이 없어요.` : `${baseLabel}엔 기록이 없었어요.`;
  const diff = current - base;
  if (diff === 0) return `${baseLabel}과 같아요.`;
  const rate = ((Math.abs(diff) / base) * 100).toFixed(1);
  return `${baseLabel}보다 ${won(Math.abs(diff))}(${rate}%) ${diff > 0 ? "늘었어요" : "줄었어요"}.`;
}

function categoryAmount(stats: MonthlyStats, categoryId: number | undefined): number {
  if (categoryId === undefined) return stats.summary.expense;
  return stats.byCategory.find((c) => c.categoryId === categoryId)?.amount ?? 0;
}

// R4-6. 챗봇 안에서 페이지네이션을 재구현하지 않고 같은 필터의 /transactions로 넘긴다.
function buildTransactionsLink(filters: Partial<TransactionsListFilters>): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.categoryId) params.set("categoryId", String(filters.categoryId));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.keyword) params.set("keyword", filters.keyword);
  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function buildAnswer(intent: ChatIntent, data: ChatData): string[] {
  switch (intent.type) {
    case "help":
      return HELP_LINES;

    case "future":
      return [`${intent.label}은 아직 오지 않았어요. 오늘까지의 기간으로 물어봐 주세요.`];

    case "monthly_summary": {
      if (!data.stats) return LOADING;
      const { income, expense, net } = data.stats.summary;
      const month = formatYearMonth(data.stats.yearMonth);
      if (intent.metric === "expense") return [`${month} 총지출은 ${won(expense)}이에요.`];
      if (intent.metric === "income") return [`${month} 총수입은 ${won(income)}이에요.`];
      if (intent.metric === "net") return [`${month} 잔액은 ${won(net)}이에요.`];
      return [`${month} 총수입 ${won(income)}, 총지출 ${won(expense)}, 잔액 ${won(net)}이에요.`];
    }

    case "category_spend": {
      if (!data.stats) return LOADING;
      const month = formatYearMonth(data.stats.yearMonth);
      const category = data.stats.byCategory.find((c) => c.categoryId === intent.categoryId);
      const lines = category
        ? [`${month} ${intent.categoryName} 지출은 ${won(category.amount)}이에요. (전체 지출의 ${percent(category.ratio)})`]
        : [`${month}엔 ${intent.categoryName} 지출 기록이 없어요.`];
      const budget = data.stats.budgets.find((b) => b.categoryId === intent.categoryId && b.budget > 0);
      if (budget) {
        lines.push(`예산 ${won(budget.budget)} 중 ${percent(budget.usageRatio)} 사용${budget.exceeded ? " — 초과!" : ""}`);
      }
      return lines;
    }

    case "top_categories": {
      if (!data.stats) return LOADING;
      const month = formatYearMonth(data.stats.yearMonth);
      const top = [...data.stats.byCategory]
        .filter((c) => c.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);
      if (top.length === 0) return [`${month}엔 지출 기록이 없어요.`];
      return [
        `${month} 지출이 많은 카테고리예요.`,
        ...top.map((c, i) => `${i + 1}. ${c.name}${c.deleted ? "(삭제됨)" : ""} · ${won(c.amount)} (${percent(c.ratio)})`),
      ];
    }

    case "forecast": {
      if (!data.stats) return LOADING;
      const month = formatYearMonth(data.stats.yearMonth);
      // R4-3. 끝난 달은 예측하지 않는다 — 서버도 그 경우 projected == confirmed다(CLAUDE.md 5장).
      if (!intent.isCurrentMonth) {
        return [`${month}은 이미 끝난 달이라 예측 대신 확정 지출을 알려드려요: ${won(data.stats.summary.expense)}`];
      }
      const forecast = data.stats.forecast;
      if (!forecast) return ["예측하려면 데이터가 조금 더 필요해요."]; // STAT-07 문구 그대로
      return [
        `이번 달 이 속도면 ${won(forecast.projectedExpense)}을 쓰게 돼요.`,
        `지금까지 ${won(forecast.confirmedExpense)} · ${forecast.daysElapsed}일 경과 · 최근 ${forecast.basisMonths}개월 기준`,
      ];
    }

    case "anomalies": {
      if (!data.stats) return LOADING;
      const month = formatYearMonth(data.stats.yearMonth);
      const { anomalies, forecast } = data.stats;
      if (anomalies.length === 0) {
        if (!forecast) return ["평소와 비교하려면 데이터가 조금 더 필요해요."];
        if (forecast.daysElapsed < 7) return ["월초(7일 미만)라 아직 평소와 비교하지 않아요."];
        return [`${month}엔 평소와 크게 다른 카테고리가 없어요.`];
      }
      return [
        `${month} 평소와 다른 카테고리예요.`,
        ...anomalies.slice(0, 3).map(
          (a) =>
            `${a.name} · 평소보다 ${percent(Math.abs(a.deltaRatio))} ${a.deltaRatio > 0 ? "많아요" : "적어요"} (이 속도면 ${won(a.currentPace)} / 평소 ${won(a.baseline)})`
        ),
      ];
    }

    case "compare": {
      if (!data.stats || !data.baseStats) return LOADING;
      const month = formatYearMonth(data.stats.yearMonth);
      const baseMonth = formatYearMonth(data.baseStats.yearMonth);
      const subject = intent.categoryName ?? "지출";
      const current = categoryAmount(data.stats, intent.categoryId);
      const base = categoryAmount(data.baseStats, intent.categoryId);
      const lines = [`${month} ${subject} ${won(current)} · ${baseMonth} ${won(base)}`, describeChange(current, base, baseMonth)];
      // R4-4. 진행 중인 달과 끝난 달을 비교하면 거의 항상 "줄었다"가 나온다 — 단서를 붙인다.
      if (intent.isCurrentMonth) {
        lines.push(`※ 이번 달은 아직 ${Number(todayString().slice(8, 10))}일째라 월말까지 더 늘 수 있어요.`);
      }
      return lines;
    }

    case "daily_spend": {
      if (!data.stats) return LOADING;
      const day = data.stats.daily.find((d) => d.date === intent.date);
      const label = dayLabel(intent.date);
      if (!day) return [`${label} 기록이 없어요.`];
      return [
        `${label} 지출 ${won(day.expense)}, 수입 ${won(day.income)}이에요.`,
        `그날 내역 보기 → ${buildTransactionsLink({ from: intent.date, to: intent.date })}`,
      ];
    }

    case "transactions_list": {
      const list = data.transactionsList;
      if (!list) return LOADING;
      const { filters } = intent;
      const total = data.transactionsTotal ?? list.length;
      const typeLabel = filters.type === "EXPENSE" ? "지출" : filters.type === "INCOME" ? "수입" : undefined;
      const scope = [filters.periodLabel, filters.scopeLabel, filters.categoryName, typeLabel].filter(Boolean).join(" · ");

      if (list.length === 0) return [`${scope} 내역이 없어요.`];

      const shown = list.slice(0, filters.displayLimit);
      const lines = [
        total > shown.length ? `${scope} 내역이에요. (전체 ${total}건 중 ${shown.length}건)` : `${scope} 내역 ${total}건이에요.`,
        ...shown.map((t) =>
          [
            formatDate(t.txnDate),
            `${t.category.name}${t.category.deleted ? "(삭제됨)" : ""}`,
            t.merchant,
            `${t.type === "EXPENSE" ? "-" : "+"}${won(t.amount)}`,
          ]
            .filter(Boolean)
            .join(" · ")
        ),
      ];

      // R4-7. 받아온 게 전체일 때만 "합계"라고 부른다.
      if (filters.wantsSum) {
        const expense = list.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
        const income = list.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
        const parts = [expense > 0 && `지출 ${won(expense)}`, income > 0 && `수입 ${won(income)}`].filter(Boolean);
        const sumLabel = total > list.length ? `최근 ${list.length}건 합계(전체 ${total}건)` : "합계";
        lines.push(`${sumLabel}: ${parts.join(", ") || "0원"}`);
      }

      lines.push(`전체 보기 → ${buildTransactionsLink(filters)}`);
      return lines;
    }

    case "budget_status": {
      if (!data.stats) return LOADING;
      const month = formatYearMonth(data.stats.yearMonth);
      const budgeted = data.stats.budgets.filter(
        (b) => b.budget > 0 && (intent.categoryId === undefined || b.categoryId === intent.categoryId)
      );
      if (budgeted.length === 0) {
        return [
          intent.categoryName ? `${month} ${intent.categoryName} 예산은 설정되지 않았어요.` : `${month}엔 설정된 예산이 없어요.`,
          "예산 설정하러 가기 → /budgets",
        ];
      }
      return [
        `${month} 예산 현황이에요.`,
        ...budgeted.map((b) => {
          const rest = b.budget - b.spent;
          const restLabel = rest >= 0 ? `남은 돈 ${won(rest)}` : `${won(-rest)} 초과!`;
          return `${b.name} · ${won(b.spent)} / ${won(b.budget)} (${percent(b.usageRatio)}) · ${restLabel}`;
        }),
      ];
    }

    case "recurring": {
      if (!data.recurring) return LOADING;
      if (data.recurring.length === 0) return ["아직 고정지출로 보이는 내역이 없어요."];
      const monthly = data.recurring.reduce((sum, r) => sum + r.medianAmount, 0);
      return [
        `고정지출로 보이는 내역이에요. 매달 약 ${won(monthly)}이 나가요.`,
        ...data.recurring.map((r) => `${r.merchant} · 약 ${won(r.medianAmount)} · ${r.monthsSeen}개월 연속`),
      ];
    }

    case "unknown":
    default:
      return ["질문을 이해하지 못했어요.", ...HELP_LINES];
  }
}
