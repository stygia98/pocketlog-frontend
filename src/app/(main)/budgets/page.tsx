"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/Skeleton";
import { MonthNavigator } from "@/components/common/MonthNavigator";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBudgetMonth } from "@/hooks/useBudgetMonth";
import { useBudgetsQuery, useUpsertBudgetsMutation } from "@/hooks/useBudgets";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/hooks/useCategories";
import { ApiRequestError } from "@/lib/apiClient";
import { formatYearMonth } from "@/lib/date";
import { getErrorMessage } from "@/lib/errorMessages";
import { formatAmount, parseAmount } from "@/lib/money";
import type { Category, TransactionType } from "@/types/transaction";

// categoryId -> 입력창에 든 콤마 없는 원본 문자열. 서버가 null로 내려준 미설정 항목은 빈 문자열로 둔다.
type BudgetDraft = Record<number, string>;

// 예산과 카테고리 관리는 둘 다 "지출 카테고리를 어떻게 쓸지" 설정하는 화면이라 한 페이지로 합쳤다.
// 두 섹션은 각자 독립된 쿼리·폼 상태를 갖는다 — 화면만 같이 둘 뿐 로직은 원래 두 페이지 그대로다.
function BudgetSection() {
  const { yearMonth, goPrev, goNext } = useBudgetMonth();
  const budgetsQuery = useBudgetsQuery(yearMonth);
  const upsertMutation = useUpsertBudgetsMutation(yearMonth);
  const [draft, setDraft] = useState<BudgetDraft>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // 월을 이동하거나 최초 로드되면 서버 값으로 입력창을 다시 채운다.
  useEffect(() => {
    if (!budgetsQuery.data) return;
    const next: BudgetDraft = {};
    for (const item of budgetsQuery.data) {
      next[item.categoryId] = item.amount != null ? String(item.amount) : "";
    }
    setDraft(next);
  }, [budgetsQuery.data]);

  if (budgetsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <MonthNavigator yearMonth={yearMonth} onPrev={goPrev} onNext={goNext} />
        <ListSkeleton count={5} />
      </div>
    );
  }

  if (budgetsQuery.isError) {
    return (
      <div className="flex flex-col gap-4">
        <MonthNavigator yearMonth={yearMonth} onPrev={goPrev} onNext={goNext} />
        <ErrorState onRetry={() => budgetsQuery.refetch()} />
      </div>
    );
  }

  const items = budgetsQuery.data ?? [];

  const handleConfirmSave = () => {
    upsertMutation.mutate(
      items.map((item) => ({
        categoryId: item.categoryId,
        amount: draft[item.categoryId] ? Number(draft[item.categoryId]) : null,
      })),
    );
    setShowConfirm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <MonthNavigator yearMonth={yearMonth} onPrev={goPrev} onNext={goNext} />

      {items.length === 0 ? (
        <EmptyState
          title="지출 카테고리가 없어요"
          description="예산을 설정하려면 지출 카테고리를 먼저 만들어 주세요."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          {items.map((item, index) => (
            <div
              key={item.categoryId}
              className={`flex items-center justify-between gap-4 p-4 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                {item.name}
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="미설정"
                className="w-32 text-right tabular-nums"
                value={draft[item.categoryId] ? formatAmount(draft[item.categoryId]) : ""}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, [item.categoryId]: parseAmount(event.target.value) }))
                }
              />
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          {upsertMutation.isError && (
            <p className="text-sm text-destructive">저장하지 못했어요. 다시 시도해 주세요.</p>
          )}
          <Button onClick={() => setShowConfirm(true)} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      )}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formatYearMonth(yearMonth)}의 예산으로 확정하시겠습니까?</DialogTitle>
            <DialogDescription>확인을 누르면 변경한 금액으로 저장됩니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmSave}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type CategoryDialogState = { mode: "create" } | { mode: "edit"; category: Category };

function CategorySection() {
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
        <EmptyState title="카테고리가 없어요" description="새 카테고리를 추가해 보세요." />
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
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                    {category.name}
                    <span className="text-xs text-muted-foreground">순서 {index}</span>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetsPageContent() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">예산</p>
        <BudgetSection />
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <p className="text-sm text-muted-foreground">카테고리 관리</p>
        <CategorySection />
      </section>
    </div>
  );
}

export default function BudgetsPage() {
  // useBudgetMonth 내부의 useSearchParams 때문에 Suspense로 감싸야 빌드가 통과한다(Next15).
  return (
    <Suspense fallback={<ListSkeleton count={5} />}>
      <BudgetsPageContent />
    </Suspense>
  );
}
