"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getToken, setToken, clearToken } from "@/lib/apiClient";
import { fetchMe, login, signup } from "@/lib/auth";
import { queryKeys } from "@/lib/queryKeys";
import type { LoginRequest, SignupRequest } from "@/types/auth";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

function decodeExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const exp = decodeExp(token);
  return exp !== null && exp * 1000 > Date.now();
}

/**
 * 화면 진입 시점의 사전 인증 게이트. apiClient의 401 자동 로그아웃(사후, API 왕복 후)과
 * 역할이 다르다 — 만료 토큰으로 보호 화면에 접근했을 때 "한 프레임도 안 보이게" 하려면
 * API 호출을 기다리지 않는 이 판정이 필요하다(CLAUDE.md 9장).
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    const token = getToken();
    if (token && isTokenValid(token)) {
      setStatus("authenticated");
      return;
    }
    if (token) clearToken();
    setStatus("unauthenticated");
  }, []);

  const logout = () => {
    clearToken();
    queryClient.clear();
    router.replace("/login");
  };

  return { status, logout };
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
    onSuccess: (data) => setToken(data.token),
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (body: SignupRequest) => signup(body),
  });
}

export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchMe,
    enabled,
  });
}
