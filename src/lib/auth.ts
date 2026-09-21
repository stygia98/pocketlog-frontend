import { apiClient } from "@/lib/apiClient";
import type { LoginRequest, LoginResponse, SignupRequest, User } from "@/types/auth";

// POST /auth/signup 응답은 ApiResponse<Void>라 data가 없다 — 토큰을 주지 않는다.
// "가입 후 자동 로그인"은 호출하는 쪽(useAuth)이 signup 성공 후 login을 이어서 호출해야 한다.
export function signup(body: SignupRequest): Promise<void> {
  return apiClient.post<void>("/auth/signup", body);
}

export function login(body: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/auth/login", body);
}

export function fetchMe(): Promise<User> {
  return apiClient.get<User>("/auth/me");
}

// PUT /auth/me — 갱신된 내 정보를 돌려준다(AUTH-10).
export function updateNickname(nickname: string): Promise<User> {
  return apiClient.put<User>("/auth/me", { nickname });
}
