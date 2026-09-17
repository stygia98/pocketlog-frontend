"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// /transactions/[id]에서만 쓴다 — 퀵 입력 바는 페이지를 떠나지 않으므로 이 가드가 필요 없다(CLAUDE.md 9장).
// 서드파티 네비게이션 가드 라이브러리 없이 beforeunload/버튼/popstate 세 경로를 직접 막는다.
export function useUnsavedChangesGuard(isDirty: boolean) {
  const router = useRouter();
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const isDirtyRef = useRef(isDirty);
  const hasPushedGuardRef = useRef(false);
  isDirtyRef.current = isDirty;

  const confirmNavigation = useCallback((action: () => void) => {
    if (!isDirtyRef.current) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setConfirmOpen(true);
  }, []);

  // (a) 새로고침 · 탭 닫기
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // (c) 브라우저 뒤로가기 — dirty로 바뀌는 순간 같은 URL을 한 번 더 밀어 "가드 항목"을 만든다.
  // 뒤로가기를 누르면 이 가드 항목부터 소비되므로 popstate로 가로챌 여지가 생긴다.
  useEffect(() => {
    if (isDirty && !hasPushedGuardRef.current) {
      window.history.pushState(null, "", window.location.href);
      hasPushedGuardRef.current = true;
    }
  }, [isDirty]);

  useEffect(() => {
    const handlePopState = () => {
      if (!isDirtyRef.current) return;
      // 방금 소비된 가드 항목을 즉시 다시 밀어 넣어 사용자를 같은 화면에 붙잡아 둔다.
      window.history.pushState(null, "", window.location.href);
      confirmNavigation(() => router.push("/transactions"));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [confirmNavigation, router]);

  const handleConfirm = useCallback(() => {
    setConfirmOpen(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, []);

  const handleCancel = useCallback(() => {
    setConfirmOpen(false);
    pendingActionRef.current = null;
  }, []);

  return { isConfirmOpen, confirmNavigation, handleConfirm, handleCancel };
}
