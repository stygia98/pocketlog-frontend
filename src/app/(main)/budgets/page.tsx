"use client";

import { Suspense, useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/Skeleton";
import { MonthNavigator } from "@/components/common/MonthNavigator";
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
import { useBudgetMonth } from "@/hooks/useBudgetMonth";
import { useBudgetsQuery, useUpsertBudgetsMutation } from "@/hooks/useBudgets";
import { formatYearMonth } from "@/lib/date";
import { formatAmount, parseAmount } from "@/lib/money";

// categoryId -> 입력창에 든 콤마 없는 원본 문자열. 서버가 null로 내려준 미설정 항목은 빈 문자열로 둔다.
type Draft = Record<number, string>;

function BudgetsPageContent() {
  const { yearMonth, goPrev, goNext } = useBudgetMonth();
  const budgetsQuery = useBudgetsQuery(yearMonth);
  const upsertMutation = useUpsertBudgetsMutation(yearMonth);
  const [draft, setDraft] = useState<Draft>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // 월을 이동하거나 최초 로드되면 서버 값으로 입력창을 다시 채운다.
  useEffect(() => {
    if (!budgetsQuery.data) return;
    const next: Draft = {};
    for (const item of budgetsQuery.data) {
      next[item.categoryId] = item.amount != null ? String(item.amount) : "";
    }
    setDraft(next);
  }, [budgetsQuery.data]);

  if (budgetsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <MonthNavigator yearMonth={yearMonth} onPrev={goPrev} onNext={goNext} />
        <ListSkeleton count={5} />
      </div>
    );
  }

  if (budgetsQuery.isError) {
    return (
      <div className="flex flex-col gap-6">
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
    <div className="flex flex-col gap-6">
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

export default function BudgetsPage() {
  // useBudgetMonth 내부의 useSearchParams 때문에 Suspense로 감싸야 빌드가 통과한다(Next15).
  return (
    <Suspense fallback={<ListSkeleton count={5} />}>
      <BudgetsPageContent />
    </Suspense>
  );
}
