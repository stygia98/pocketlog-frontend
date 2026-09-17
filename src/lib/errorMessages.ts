// 서버 error.code -> 화면 문구 매핑 (PRD.md 5.1 표가 정본). 화면은 이 함수만 쓴다.

export interface ApiErrorLike {
  code: string;
  message: string;
}

const DEFAULT_MESSAGE = "일시적인 오류가 발생했습니다. 다시 시도해 주세요.";

// PRD.md 5.1 표에 있는 코드만 담는다. 표에 없는 코드(FORBIDDEN, NOT_FOUND, METHOD_NOT_ALLOWED 등)는
// DEFAULT_MESSAGE로 폴백한다 — 이 프로젝트에는 별도 문구가 지정돼 있지 않다.
const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_DUPLICATED: "이미 사용 중인 이메일입니다.",
  CATEGORY_DUPLICATED: "같은 이름의 카테고리가 이미 있습니다.",
  CATEGORY_TYPE_MISMATCH: "수입/지출 구분이 카테고리와 맞지 않습니다.",
  TRANSACTION_NOT_FOUND: "거래 내역을 찾을 수 없습니다.",
  CATEGORY_NOT_FOUND: "카테고리를 찾을 수 없습니다.",
  INVALID_CSV: "CSV 파일을 읽을 수 없습니다. 형식을 확인해 주세요.",
  INTERNAL_ERROR: DEFAULT_MESSAGE,
};

/**
 * 서버 에러를 화면 문구로 변환한다.
 * - INVALID_INPUT: 서버가 준 필드 메시지를 그대로 쓴다(GlobalExceptionHandler가 이미 하나로 정리해 보낸다).
 * - UNAUTHORIZED: 로그인 폼에서는 전용 문구, 그 외에는 문구 없이 apiClient가 자동으로 /login 이동을 처리하므로 빈 문자열.
 * - 나머지: 매핑 표 조회, 없으면 DEFAULT_MESSAGE.
 */
export function getErrorMessage(error: ApiErrorLike, options?: { context?: "login" }): string {
  if (error.code === "INVALID_INPUT") {
    return error.message || DEFAULT_MESSAGE;
  }
  if (error.code === "UNAUTHORIZED") {
    return options?.context === "login" ? "이메일 또는 비밀번호가 올바르지 않습니다." : "";
  }
  return ERROR_MESSAGES[error.code] ?? DEFAULT_MESSAGE;
}
