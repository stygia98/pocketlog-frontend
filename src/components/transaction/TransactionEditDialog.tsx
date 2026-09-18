"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm, type TransactionFormValues } from "@/components/transaction/TransactionForm";
import { useUpdateTransactionMutation } from "@/hooks/useTransactions";
import { ApiRequestError } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errorMessages";
import type { Category, Transaction } from "@/types/transaction";

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

interface TransactionEditDialogProps {
  transaction: Transaction;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

// 목록 행 클릭 시 /transactions/[id]로 이동하던 것을 팝업으로 바꾼 것이 이 컴포넌트다.
// 상세 페이지 자체는 직접 링크 접근용으로 남겨두되, 목록에서는 여기서 바로 수정한다.
export function TransactionEditDialog({
  transaction,
  categories,
  open,
  onOpenChange,
  onDelete,
}: TransactionEditDialogProps) {
  const [values, setValues] = useState<TransactionFormValues>(() => toFormValues(transaction));
  const [initialValues, setInitialValues] = useState<TransactionFormValues>(() => toFormValues(transaction));
  const [serverError, setServerError] = useState<string | undefined>();
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const updateMutation = useUpdateTransactionMutation(transaction.id);

  // 열릴 때마다 최신 거래 값으로 다시 초기화한다 — 다이얼로그는 행마다 상시 마운트돼 있어
  // 이전에 편집하다 취소한 값이 남아있을 수 있다.
  useEffect(() => {
    if (!open) return;
    const formValues = toFormValues(transaction);
    setValues(formValues);
    setInitialValues(formValues);
    setServerError(undefined);
  }, [open, transaction]);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  const requestClose = () => {
    if (isDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (values.categoryId === null) return;
    setServerError(undefined);
    try {
      await updateMutation.mutateAsync({
        type: values.type,
        amount: Number(values.amountRaw),
        txnDate: values.txnDate,
        categoryId: values.categoryId,
        merchant: values.merchant || undefined,
        memo: values.memo || undefined,
        latitude: values.latitude ?? undefined,
        longitude: values.longitude ?? undefined,
      });
      onOpenChange(false);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? getErrorMessage(error) : "연결에 실패했습니다.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>거래 수정</DialogTitle>
          </DialogHeader>

          <TransactionForm
            idPrefix={`edit-${transaction.id}`}
            layout="stacked"
            values={values}
            onChange={setValues}
            categories={categories}
            submitLabel="저장"
            isSubmitting={updateMutation.isPending}
            serverError={serverError}
            onSubmit={handleSubmit}
            showDeleteButton
            onDelete={() => {
              onOpenChange(false);
              onDelete();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDiscardConfirmOpen} onOpenChange={(next) => !next && setIsDiscardConfirmOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>저장하지 않은 변경 사항이 있어요</DialogTitle>
            <DialogDescription>지금 닫으면 변경한 내용이 사라집니다. 계속하시겠어요?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscardConfirmOpen(false)}>
              계속 편집
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsDiscardConfirmOpen(false);
                onOpenChange(false);
              }}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
