"use client";

import { useCallback, useState } from "react";

type Theme = "light" | "dark";

// layout.tsx의 인라인 스크립트가 하이드레이션 전에 이미 .dark를 붙여뒀으므로, 그 결과를
// 그대로 읽어 초기 상태로 쓴다 — 여기서 다시 판정하면 스크립트와 로직이 어긋날 수 있다.
function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
