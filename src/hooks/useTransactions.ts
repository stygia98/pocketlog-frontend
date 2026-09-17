"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from "@/lib/transactions";
import { getErrorMessage } from "@/lib/errorMessages";
import { queryKeys, type TransactionListParams } from "@/lib/queryKeys";
import type { ApiRequestError } from "@/lib/apiClient";
import type {
  PageResponse,
  Transaction,
  TransactionCreateRequest,
  TransactionUpdateRequest,
} from "@/types/transaction";

// 거래를 변경하면 거래 목록뿐 아니라 대시보드(stats)·예산(budgets) 캐시도 함께 무효화한다.
// 두 화면이 아직 없어도(Phase10·11에서 만든다) 이 규칙을 지금 넣어 두면 나중에 빠뜨릴 일이 없다(CLAUDE.md 9장).
function invalidateRelatedQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["stats"] });
  queryClient.invalidateQueries({ queryKey: ["budgets"] });
}

function isPageResponse(data: unknown): data is PageResponse<Transaction> {
  return (
    typeof data === "object" &&
    data !== null &&
    "content" in data &&
    Array.isArray((data as PageResponse<Transaction>).content)
  );
}

export function useTransactionListQuery(params: TransactionListParams) {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => listTransactions(params),
  });
}

export function useTransactionQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => getTransaction(id),
  });
}

// 생성/수정은 낙관적 업데이트를 하지 않는다 — 서버가 채우는 id·카테고리 조인 결과가 있어
// 임시 데이터와 어긋난다(CLAUDE.md 9장). 서버 응답을 기다린 뒤 관련 캐시를 무효화한다.
export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TransactionCreateRequest) => createTransaction(body),
    onSuccess: () => invalidateRelatedQueries(queryClient),
  });
}

export function useUpdateTransactionMutation(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TransactionUpdateRequest) => updateTransaction(id, body),
    onSuccess: () => invalidateRelatedQueries(queryClient),
  });
}

interface DeleteContext {
  previousLists: Array<[QueryKey, unknown]>;
}

// 삭제에만 낙관적 업데이트를 적용한다(CLAUDE.md 9장) — 결과가 자명하고 되돌리기도 쉽다.
export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiRequestError, number, DeleteContext>({
    mutationFn: (id: number) => deleteTransaction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all() });

      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.transactions.all() });

      previousLists.forEach(([key, data]) => {
        if (!isPageResponse(data)) return;
        queryClient.setQueryData<PageResponse<Transaction>>(key, {
          ...data,
          content: data.content.filter((t) => t.id !== id),
          totalElements: Math.max(0, data.totalElements - 1),
        });
      });

      return { previousLists };
    },
    onError: (error, _id, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(getErrorMessage(error));
    },
    // onSettled(무조건 무효화)를 쓰면 서버가 다운된 상태에서 재조회까지 실패해, 방금 롤백한
    // 목록이 화면째 ErrorState로 덮여 버린다(TXN-11 — 롤백된 항목이 보이지 않는 버그).
    // 성공했을 때만 무효화해 서버 확정 데이터로 갱신한다.
    onSuccess: () => invalidateRelatedQueries(queryClient),
  });
}
