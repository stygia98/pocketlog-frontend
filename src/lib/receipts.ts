// 영수증 이미지를 브라우저 안에서 Tesseract.js(WASM OCR)로 읽어 텍스트를 뽑고, 정규식/키워드
// 휴리스틱으로 날짜·거래처·금액·카테고리를 추정한다. 외부 API를 호출하지 않는다 — 네트워크는
// 최초 1회 언어 데이터(kor+eng traineddata)를 받을 때만 쓰이고, 그 뒤로는 완전히 오프라인으로
// 동작한다. 종이 영수증 사진과 카드사 앱의 결제 확인 화면(라벨-값 2열, 2자리 연도) 둘 다 다룬다.
import { createWorker } from "tesseract.js";
import type { ReceiptParseResult } from "@/types/receipt";
import type { Category } from "@/types/transaction";

const TOTAL_KEYWORDS = ["합계", "총액", "결제금액", "받을금액", "카드승인금액", "승인금액"];
const DATE_KEYWORDS = ["거래일자", "거래일시", "결제일시", "이용일시", "승인일시", "매출일시", "판매일", "영업일"];

// "업종"(카드 결제 확인 화면에 흔히 있는 가맹점 분류) → 우리 앱 기본 카테고리 이름.
// 완전한 분류표가 아니라 흔한 값 몇 가지만 다룬다. 매칭되지 않으면 null로 두고 사용자가 고른다
// — 어설프게 추측해서 조용히 틀린 카테고리로 저장되는 것보다 낫다(§ 하단 categoryId 처리 참조).
const INDUSTRY_TO_CATEGORY: Record<string, string> = {
  한식: "식비",
  중식: "식비",
  일식: "식비",
  양식: "식비",
  분식: "식비",
  카페: "식비",
  커피: "식비",
  제과: "식비",
  패스트푸드: "식비",
  주점: "식비",
  마트: "생활용품",
  편의점: "생활용품",
  슈퍼마켓: "생활용품",
  주유소: "교통",
  택시: "교통",
  버스: "교통",
  지하철: "교통",
  철도: "교통",
  주차장: "교통",
  병원: "의료/건강",
  약국: "의료/건강",
  의원: "의료/건강",
  한의원: "의료/건강",
  치과: "의료/건강",
  영화관: "문화/여가",
  서점: "문화/여가",
  여행사: "문화/여가",
  스포츠: "문화/여가",
  통신: "주거/통신",
  관리비: "주거/통신",
};

// 키워드가 있는 줄에서 우선 찾고, 못 찾으면 본문에서 가장 큰 숫자를 합계로 추정한다
// (영수증에서 총액은 개별 품목 금액보다 항상 크다는 경험칙).
function extractAmount(text: string): number | null {
  const lines = text.split("\n");
  for (const keyword of TOTAL_KEYWORDS) {
    const line = lines.find((l) => l.includes(keyword));
    const digits = line?.replace(/[^0-9]/g, "");
    if (digits) return Number(digits);
  }
  const numbers = [...text.matchAll(/\d[\d,]{3,}/g)]
    .map((m) => Number(m[0].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  return numbers.length > 0 ? Math.max(...numbers) : null;
}

// 월 1~12, 일 1~31 범위를 벗어나면 날짜로 보지 않는다 — 키워드 없이 본문 전체를 훑을 때
// 카드번호·전화번호 같은 무관한 숫자열을 날짜로 오인하는 것을 줄이는 최소한의 방어선이다.
function toDateOrNull(year: string, month: string, day: string): string | null {
  const m = Number(month);
  const d = Number(day);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// "yyyy-MM-dd" / "yyyy.MM.dd" / "yy.MM.dd" 형태에서 연월일을 뽑아 정규화한다. 4자리 연도를
// 우선 찾고, 없으면 2자리 연도(20xx로 간주)도 시도한다.
function matchDate(text: string): string | null {
  const full = text.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (full) {
    const found = toDateOrNull(full[1], full[2], full[3]);
    if (found) return found;
  }
  const short = text.match(/(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (short) {
    const found = toDateOrNull(`20${short[1]}`, short[2], short[3]);
    if (found) return found;
  }
  return null;
}

function extractDate(text: string): string | null {
  // "판매일"/"거래일자" 같은 키워드가 있는 줄로 먼저 좁힌다 — OCR이 라벨 자체를 오독해도
  // ("판매일"→"파매일") 아래 전체 스캔이 2차 방어선이 되어 준다.
  const lines = text.split("\n");
  for (const keyword of DATE_KEYWORDS) {
    const line = lines.find((l) => l.includes(keyword));
    if (line) {
      const found = matchDate(line);
      if (found) return found;
    }
  }
  return matchDate(text);
}

// 쉼표·공백·괄호 등을 지운 뒤 남는 게 전부 숫자면 "금액 줄"로 보고 상호 후보에서 제외한다.
// 단순히 문자 화이트리스트로만 판정하면 "11,000원"이 OCR 노이즈로 "11,0004"처럼 깨졌을 때도
// 숫자 줄로 잡아내지 못해 상호로 잘못 뽑힌다 — 그 노이즈 문자도 결국 숫자이기 때문에 이 방식이면 걸러진다.
function isMostlyNumeric(line: string): boolean {
  const stripped = line.replace(/[,.\s()\-:]/g, "");
  return stripped.length === 0 || /^\d+$/.test(stripped);
}

// 숫자 줄이 아닌 첫 줄을 상호명으로 추정한다(영수증은 보통 상호가 맨 위나 맨 앞에 있다).
function extractMerchant(text: string): string | null {
  const line = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length >= 2 && !isMostlyNumeric(l));
  return line ?? null;
}

// "업종" 줄의 값을 흔한 분류 사전과 대조해 카테고리 이름을 추정한다. 실제 categoryId 매칭은
// 호출자가 사용자의 카테고리 목록과 대조해서 한다(이름이 같아도 사용자가 지웠을 수 있어서).
function extractCategoryName(text: string): string | null {
  const line = text.split("\n").find((l) => l.trim().startsWith("업종"));
  if (!line) return null;
  const value = line.replace("업종", "").trim();
  const matched = Object.entries(INDUSTRY_TO_CATEGORY).find(([keyword]) => value.includes(keyword));
  return matched?.[1] ?? null;
}

// categories는 사용자가 실제로 쓰는 지출 카테고리 목록이다. 사전에서 이름을 추정해도, 그 이름의
// 카테고리를 사용자가 지우거나 다르게 지었으면 매칭에 실패해 categoryId는 null로 남는다(정상 동작).
export async function parseReceipt(file: File, categories: Category[]): Promise<ReceiptParseResult> {
  const worker = await createWorker("kor+eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(file);

    const guessedName = extractCategoryName(text);
    const category = categories.find((c) => c.type === "EXPENSE" && !c.deleted && c.name === guessedName);

    return {
      txnDate: extractDate(text),
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? null,
      merchant: extractMerchant(text),
      amount: extractAmount(text),
    };
  } finally {
    await worker.terminate();
  }
}
