import { QueryClient } from "@tanstack/react-query";

/** 서버 상태는 전부 React Query가 들고, 인스턴스는 QueryProvider에서 컴포넌트당 하나만 만들어 쓴다. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 로컬 API라 재요청 비용이 작지만, 화면 전환마다 매번 다시 받는 것도 불필요하다.
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
  });
}
