// PRD.md 5.1 「챗봇 규칙」 회귀 검사. 실제 lib/chat/intents.ts를 그대로 실행한다(Node 24의 TS 실행 + "@/" 경로 매핑).
// 실행: npm run check:chat — 규칙을 고치면 여기 표도 같이 고친다. 의존성·테스트 러너 없이 돈다.

import { register } from "node:module";

const src = new URL("../src/", import.meta.url).href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) return next(${JSON.stringify(src)} + specifier.slice(2) + ".ts", context);
  return next(specifier, context);
}`)
);

const { parseIntent } = await import("../src/lib/chat/intents.ts");
const { daysAgoString, shiftYearMonth, todayString, toYearMonthString } = await import("../src/lib/date.ts");

const categories = [
  ["식비", "EXPENSE"], ["교통", "EXPENSE"], ["주거/통신", "EXPENSE"], ["생활용품", "EXPENSE"], ["문화/여가", "EXPENSE"],
  ["의료/건강", "EXPENSE"], ["기타", "EXPENSE"], ["급여", "INCOME"], ["기타수입", "INCOME"],
].map(([name, type], i) => ({ id: i + 1, name, type, color: "#737373", deleted: false, sortOrder: i }));

const current = toYearMonthString(new Date());
const currentMonth = Number(current.slice(5));
const last = shiftYearMonth(current, -1);

// [입력, 기대값(부분 일치), 이 케이스가 지키는 규칙]
const cases = [
  ["이번달 지출 얼마야", { type: "monthly_summary", metric: "expense", yearMonth: current }, "R3-14"],
  ["지난달 수입", { type: "monthly_summary", metric: "income", yearMonth: last }, "R2 지난달"],
  ["이번달 지촐 얼마야", { type: "monthly_summary", metric: "expense" }, "R1-2 자모 오타"],
  ["총지출", { type: "monthly_summary", metric: "expense" }, "R3-14 한 가지만"],
  ["잔액", { type: "monthly_summary", metric: "net" }, "R3-14"],
  ["3개월 동안 지출", { type: "monthly_summary", yearMonth: current }, "R2 3개월은 달이 아님"],
  ["고정 지출 뭐있어", { type: "recurring" }, "R1-1 띄어쓰기"],
  ["정기결재 뭐 있어", { type: "recurring" }, "R1-2 결재/결제"],
  ["예산 얼마 남았어", { type: "budget_status" }, "R3-4"],
  ["예샨 얼마 남음", { type: "budget_status" }, "R1-2 자모 오타"],
  ["식비 예산", { type: "budget_status", categoryName: "식비" }, "R3-4 카테고리"],
  ["이번달 예상 지출", { type: "forecast", isCurrentMonth: true }, "R1-2 예상≠예산"],
  ["평소보다 많이 쓴 거 있어?", { type: "anomalies" }, "R3-6이 7·8보다 먼저"],
  ["지난달보다 얼마나 더 썼어", { type: "compare", yearMonth: current, baseYearMonth: last }, "R3-7 X보다"],
  ["지난달이랑 비교해줘", { type: "compare", yearMonth: last, baseYearMonth: shiftYearMonth(current, -2) }, "R3-7 달 하나"],
  ["제일 많이 쓴 카테고리", { type: "top_categories" }, "R3-8"],
  ["스타벅스에서 얼마 썼어", { type: "transactions_list", filters: { keyword: "스타벅스", wantsSum: true, size: 20 } }, "R3-9"],
  ['"넷플릭스" 내역', { type: "transactions_list", filters: { keyword: "넷플릭스" } }, "R3-9 따옴표가 목록보다 먼저"],
  ["식비에서 얼마", { type: "category_spend", categoryName: "식비" }, "R3-9 카테고리면 거래처 아님"],
  ["지출 내역 보여줘", { type: "transactions_list", filters: { type: "EXPENSE", wantsSum: false, size: 5 } }, "R3-10"],
  ["최근 7일 지출 내역 10건", { type: "transactions_list", filters: { from: daysAgoString(6), displayLimit: 10, size: 10 } }, "R3-10 N건"],
  ["급여 얼마 들어왔어", { type: "transactions_list", filters: { categoryName: "급여", wantsSum: true } }, "R3-11"],
  ["기타수입 얼마", { type: "transactions_list", filters: { categoryName: "기타수입" } }, "R1-4 긴 이름 우선"],
  ["오늘 얼마 썼어", { type: "daily_spend", date: todayString() }, "R3-12"],
  ["어제 식비", { type: "transactions_list", filters: { categoryName: "식비", from: daysAgoString(1), wantsSum: true } }, "R3-12 카테고리"],
  ["통신비 얼마 나갔어", { type: "category_spend", categoryName: "주거/통신" }, "R1-4 / 조각"],
  ["교통비 얼마 썼어", { type: "category_spend", categoryName: "교통" }, "R3-13"],
  [`${currentMonth}월 식비`, { type: "category_spend", categoryName: "식비", yearMonth: current }, "R3-13 이름만"],
  ["2099년 1월 지출", { type: "future" }, "R3-2"],
  ["도움", { type: "help" }, "R3-1"],
  ["오는 길에 커피 얼마였지", { type: "unknown" }, "R1-2 날짜 단어는 오타 보정 안 함"],
  ["엄마한테 용돈 줬어", { type: "unknown" }, "R1-2 엄마≠얼마"],
  ["이거 얼마야", { type: "unknown" }, "R3 얼마 단독 금지"],
];

if (currentMonth < 12) {
  const next = currentMonth + 1;
  const lastYear = `${Number(current.slice(0, 4)) - 1}-${String(next).padStart(2, "0")}`;
  cases.push([`${next}월 지출`, { type: "monthly_summary", yearMonth: lastYear }, "R2 안 온 달은 작년"]);
}

function contains(actual, expected) {
  return Object.entries(expected).every(([key, value]) =>
    value !== null && typeof value === "object" ? contains(actual?.[key] ?? {}, value) : actual?.[key] === value
  );
}

let failed = 0;
for (const [input, expected, rule] of cases) {
  const actual = parseIntent(input, categories, current);
  const ok = contains(actual, expected);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${rule.padEnd(24)} ${JSON.stringify(input)}${ok ? "" : `\n     기대 ${JSON.stringify(expected)}\n     실제 ${JSON.stringify(actual)}`}`);
}
console.log(failed ? `\n${failed}/${cases.length} 실패` : `\n${cases.length}건 모두 통과`);
process.exit(failed ? 1 : 0);
