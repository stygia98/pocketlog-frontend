"use client";

import { useEffect, useState } from "react";

// Tailwind sm(640px) 미만을 모바일로 본다 — 이 프로젝트가 반응형을 나누는 기준과 동일하다.
const MOBILE_QUERY = "(max-width: 639px)";

// 서버에는 뷰포트 정보가 없으므로 판정 전에는 null을 반환한다. 호출부는 null인 동안
// 데스크톱·모바일 어느 쪽 데이터도 요청하지 않아야 한다(둘 다 마운트하는 낭비 방지).
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
