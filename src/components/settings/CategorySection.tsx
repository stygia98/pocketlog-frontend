"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { EmptyState } from "@/components/common/EmptyState";
import { TagsArt } from "@/components/illustration/Art";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/Skeleton";
import { CATEGORY_PALETTE, CategoryForm, type CategoryFormValues } from "@/components/settings/CategoryForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/hooks/useCategories";
import { ApiRequestError } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errorMessages";
import type { Category, TransactionType } from "@/types/transaction";

type CategoryDialogState = { mode: "create" } | { mode: "edit"; category: Category };

export function CategorySection() {
  const [activeType, setActiveType] = useState<TransactionType>("EXPENSE");
  const [dialogState, setDialogState] = useState<CategoryDialogState | null>(null);
  const [formValues, setFormValues] = useState<CategoryFormValues>({
    name: "",
    color: CATEGORY_PALETTE[0],
    sortOrder: 0,
  });
  const [formError, setFormError] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const categoriesQuery = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  if (categoriesQuery.isLoading) return <ListSkeleton count={5} />;
  if (categoriesQuery.isError) return <ErrorState onRetry={() => categoriesQuery.refetch()} />;

  // 서버가 이미 sortOrder ASC, id ASC로 정렬해 내려주므로, 배열의 위치 자체가 현재 표시 순서다
  // (CategoryResponse에 sortOrder 값 자체는 없다 — 배열 인덱스로 대체한다).
  const categoriesForType = (categoriesQuery.data ?? []).filter(
    (category) => category.type === activeType && !category.deleted,
  );

  const openCreateDialog = () => {
    setDialogState({ mode: "create" });
    setFormValues({ name: "", color: CATEGORY_PALETTE[0], sortOrder: categoriesForType.length });
    setFormError(undefined);
  };

  const openEditDialog = (category: Category, index: number) => {
    setDialogState({ mode: "edit", category });
    setFormValues({ name: category.name, color: category.color, sortOrder: index });
    setFormError(undefined);
  };

  const handleApiError = (error: unknown) => {
    setFormError(error instanceof ApiRequestError ? getErrorMessage(error) : undefined);
  };

  const handleSubmit = () => {
    const body = { name: formValues.name.trim(), color: formValues.color, sortOrder: formValues.sortOrder };
    if (dialogState?.mode === "create") {
      createMutation.mutate(
        { ...body, type: activeType },
        { onSuccess: () => setDialogState(null), onError: handleApiError },
      );
    } else if (dialogState?.mode === "edit") {
      updateMutation.mutate(
        { id: dialogState.category.id, body },
        { onSuccess: () => setDialogState(null), onError: handleApiError },
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    // 삭제에만 낙관적 업데이트를 적용한다(CLAUDE.md 9장) — 확인 즉시 닫고 백그라운드에서 처리한다.
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={activeType} onValueChange={(value) => setActiveType(value as TransactionType)}>
        <TabsList>
          <TabsTrigger value="EXPENSE">지출</TabsTrigger>
          <TabsTrigger value="INCOME">수입</TabsTrigger>
        </TabsList>
      </Tabs>

      {categoriesForType.length === 0 ? (
        <EmptyState art={<TagsArt />} title="카테고리가 없어요" description="새 카테고리를 추가해 보세요." />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <AnimatePresence initial={false}>
            {categoriesForType.map((category, index) => (
              <motion.div
                key={category.id}
                layout={!shouldReduceMotion}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: shouldReduceMotion ? 0 : index * 0.03 } }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className={`flex items-center justify-between gap-4 p-4 ${index > 0 ? "border-t border-border" : ""}`}
                >
                  {/* 순서를 앞에 고정 너비로 두어 카테고리 이름의 시작 위치가 모든 행에서 세로로 맞는다. */}
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <span className="w-14 shrink-0 text-xs font-normal tabular-nums text-muted-foreground">
                      순서 {index}
                    </span>
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                    <span className="truncate">{category.name}</span>
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(category, index)}>
                      수정
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteTarget(category)}>
                      삭제
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div>
        <Button onClick={openCreateDialog}>카테고리 추가</Button>
      </div>

      <Dialog open={dialogState !== null} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState?.mode === "edit" ? "카테고리 수정" : "카테고리 추가"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            values={formValues}
            onChange={setFormValues}
            submitLabel={dialogState?.mode === "edit" ? "저장" : "추가"}
            isSubmitting={isSubmitting}
            serverError={formError}
            onSubmit={handleSubmit}
            onCancel={() => setDialogState(null)}
            idPrefix="category-form"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리를 삭제할까요?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; 카테고리를 삭제합니다. 과거 내역은 그대로 남습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="py-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
