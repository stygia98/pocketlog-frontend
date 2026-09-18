"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionForm, type TransactionFormValues } from "@/components/transaction/TransactionForm";
import { useCategoriesQuery } from "@/hooks/useCategories";
import {
  useDeleteTransactionMutation,
  useTransactionQuery,
  useUpdateTransactionMutation,
} from "@/hooks/useTransactions";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { ApiRequestError } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errorMessages";
import type { Transaction } from "@/types/transaction";

function toFormValues(transaction: Transaction): TransactionFormValues {
  return {
    type: transaction.type,
    amountRaw: String(transaction.amount),
    txnDate: transaction.txnDate,
    categoryId: transaction.category.id,
    merchant: transaction.merchant ?? "",
    memo: transaction.memo ?? "",
    latitude: transaction.latitude,
    longitude: transaction.longitude,
  };
}

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const categoriesQuery = useCategoriesQuery();
  const transactionQuery = useTransactionQuery(id);
  const updateMutation = useUpdateTransactionMutation(id);
  const deleteMutation = useDeleteTransactionMutation();

  const [values, setValues] = useState<TransactionFormValues | null>(null);
  const [initialValues, setInitialValues] = useState<TransactionFormValues | null>(null);
  const [serverError, setServerError] = useState<string | undefined>();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (transactionQuery.data) {
      const formValues = toFormValues(transactionQuery.data);
      setValues(formValues);
      setInitialValues(formValues);
    }
  }, [transactionQuery.data]);

  // 금액은 TransactionForm이 이미 콤마 없는 원본 문자열(amountRaw)로만 들고 있으므로
  // 콤마 표시 차이로 dirty가 오판되지 않는다(CLAUDE.md 9장 dirty 판정 규칙).
  const isDirty =
    values !== null && initialValues !== null && JSON.stringify(values) !== JSON.stringify(initialValues);
  const { isConfirmOpen, confirmNavigation, handleConfirm, handleCancel } = useUnsavedChangesGuard(isDirty);

  if (transactionQuery.isError) {
    const isNotFound =
      transactionQuery.error instanceof ApiRequestError && transactionQuery.error.code === "TRANSACTION_NOT_FOUND";
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {isNotFound ? "거래 내역을 찾을 수 없습니다." : "일시적인 오류가 발생했습니다."}
        </p>
        <Button asChild variant="outline">
          <Link href="/transactions">목록으로</Link>
        </Button>
      </div>
    );
  }

  // 스피너 대신 스켈레톤을 쓴다(CLAUDE.md 9장) — TransactionForm과 같은 필드 배치로 만들어
  // 로딩이 끝났을 때 레이아웃이 튀지 않게 한다.
  if (!values || !categoriesQuery.data) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="불러오는 중">
        <Skeleton className="h-7 w-24" />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (values.categoryId === null) return;
    setServerError(undefined);
    try {
      const updated = await updateMutation.mutateAsync({
        type: values.type,
        amount: Number(values.amountRaw),
        txnDate: values.txnDate,
        categoryId: values.categoryId,
        merchant: values.merchant || undefined,
        memo: values.memo || undefined,
        latitude: values.latitude ?? undefined,
        longitude: values.longitude ?? undefined,
      });
      // 가드를 먼저 해제(초기값을 저장된 값으로 갱신)한 뒤 이동한다 — 순서를 바꾸면
      // router.push 도중 popstate/beforeunload가 여전히 dirty로 오판할 수 있다.
      setInitialValues(toFormValues(updated));
      router.push("/transactions");
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? getErrorMessage(error) : "연결에 실패했습니다.");
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleteConfirmOpen(false);
    await deleteMutation.mutateAsync(id);
    router.push("/transactions");
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-xl font-medium">거래 상세</h1>

      <TransactionForm
        idPrefix="detail"
        values={values}
        onChange={setValues}
        categories={categoriesQuery.data}
        submitLabel="저장"
        isSubmitting={updateMutation.isPending}
        serverError={serverError}
        onSubmit={handleSubmit}
        showDeleteButton
        onDelete={() => setIsDeleteConfirmOpen(true)}
      />

      <Button
        type="button"
        variant="ghost"
        className="self-start"
        onClick={() => confirmNavigation(() => router.push("/transactions"))}
      >
        목록으로
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>저장하지 않은 변경 사항이 있어요</DialogTitle>
            <DialogDescription>지금 나가면 변경한 내용이 사라집니다. 계속하시겠어요?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              계속 편집
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              나가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>삭제하시겠습니까?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
