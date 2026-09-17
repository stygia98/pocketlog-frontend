// 백엔드 dto record(CategoryResponse/TransactionResponse/TransactionCreateRequest/TransactionUpdateRequest/
// PageResponse)와 1:1로 맞춘 타입. amount는 서버가 JSON 숫자로 내려준다(문자열 아님).

export type TransactionType = "INCOME" | "EXPENSE";

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  color: string;
  deleted: boolean;
}

export interface CategoryCreateRequest {
  name: string;
  type: TransactionType;
  color: string;
  sortOrder?: number;
}

// type은 생성 후 변경할 수 없으므로 필드 자체를 두지 않는다(CLAUDE.md 5장).
export interface CategoryUpdateRequest {
  name: string;
  color: string;
  sortOrder?: number;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  txnDate: string;
  merchant: string | null;
  memo: string | null;
  category: Category;
}

export interface TransactionCreateRequest {
  type: TransactionType;
  amount: number;
  txnDate: string;
  categoryId: number;
  merchant?: string;
  memo?: string;
}

// PUT은 전체 교체다 — merchant/memo를 누락하면 서버가 null로 저장한다(CLAUDE.md 5장).
export type TransactionUpdateRequest = TransactionCreateRequest;

// 아직 다른 화면이 페이지 응답을 쓰지 않으므로 공용 types/common.ts로 승격하지 않는다(조기 추상화 방지).
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
