"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { createQueryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/sonner";

/**
 * QueryClient는 useState의 초기화 함수로 한 번만 만든다. 모듈 스코프에 두면 여러 요청이
 * 동시에 같은 인스턴스를 공유해 캐시가 섞일 수 있고(SSR 일반 원칙), useState 없이 렌더마다
 * 새로 만들면 리렌더될 때마다 캐시가 날아간다.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
