// 모든 API 호출은 이 모듈을 통해서만 한다: 토큰 주입, ApiResponse 봉투 언래핑, 401 자동 로그아웃.
// CLAUDE.md 5장 "공통 응답 포맷" · 9장 "라우트 보호는 middleware로 하지 않는다"(토큰이 localStorage에 있음) 참조.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_PREFIX = "/api/v1";
const TOKEN_KEY = "moneylog_token";

interface ApiSuccessBody<T> {
  success: true;
  data: T;
  error: null;
}

interface ApiErrorBody {
  success: false;
  data: null;
  error: { code: string; message: string };
}

type ApiResponseBody<T> = ApiSuccessBody<T> | ApiErrorBody;

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage를 쓸 수 없는 환경(프라이빗 모드 등)에서는 조용히 무시한다.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // 위와 동일하게 무시한다.
  }
}

type QueryParams = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  params?: QueryParams;
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${API_PREFIX}${path}`, API_BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const body = (await response.json()) as ApiResponseBody<T>;

  if (!body.success) {
    // 토큰은 유효한데 사용자가 없는 경우도 401 UNAUTHORIZED로 오므로(CLAUDE.md 5장 "인증 예외 케이스"),
    // 이 코드를 만나면 무조건 로그아웃 처리한다. 로그인 폼 자체의 401(비밀번호 오류)은 이 클라이언트가
    // 아니라 로그인 화면이 직접 처리한다.
    if (body.error.code === "UNAUTHORIZED" && path !== "/auth/login") {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw new ApiRequestError(body.error.code, body.error.message, response.status);
  }

  return body.data;
}

export const apiClient = {
  get: <T>(path: string, params?: QueryParams) => request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
