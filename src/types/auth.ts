// 백엔드 dto record(SignupRequest/LoginRequest/LoginResponse/UserResponse)와 1:1로 맞춘 타입.
// UserResponse에는 id가 없다 — 사용자 id는 JWT sub 클레임에서만 얻는다.

export interface User {
  email: string;
  nickname: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}
