"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createCategory, deleteCategory, listCategories, updateCategory } from "@/lib/categories";
import { getErrorMessage } from "@/lib/errorMessages";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiRequestError } from "@/lib/apiClient";
import type { Category, CategoryCreateRequest, CategoryUpdateRequest } from "@/types/transaction";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: listCategories,
  });
}

// 생성/수정은 낙관적 업데이트를 하지 않는다 — 서버가 채우는 id가 있고, 실패 시 폼이 여전히
// 열려 있어 인라인 에러로 바로 보여줄 수 있다(CLAUDE.md 9장 "삭제에만 적용" 원칙).
export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryCreateRequest) => createCategory(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
      toast.success("카테고리를 추가했어요");
    },
  });
}

// 수정 대상은 다이얼로그가 열릴 때만 정해지므로, id를 훅 인자가 아니라 mutate 호출 시점에
// 받는다 — 그래야 페이지 최상위에서 훅을 조건 없이 한 번만 호출할 수 있다.
export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: CategoryUpdateRequest }) => updateCategory(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
      toast.success("카테고리를 수정했어요");
    },
  });
}

// 삭제에만 낙관적 업데이트를 적용한다(CLAUDE.md 9장) — 결과가 자명하고 되돌리기도 쉽다.
export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiRequestError, number, { previous: Category[] | undefined }>({
    mutationFn: (id: number) => deleteCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all() });
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories.all());
      queryClient.setQueryData<Category[]>(
        queryKeys.categories.all(),
        (old) => old?.filter((category) => category.id !== id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context) queryClient.setQueryData(queryKeys.categories.all(), context.previous);
      toast.error(getErrorMessage(error));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() }),
  });
}
