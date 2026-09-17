"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TransactionForm, type TransactionFormValues } from "@/components/transaction/TransactionForm";
import { useCreateTransactionMutation } from "@/hooks/useTransactions";
import { useReceiptParseMutation } from "@/hooks/useReceipts";
import { ApiRequestError } from "@/lib/apiClient";
import { todayString } from "@/lib/date";
import { getErrorMessage } from "@/lib/errorMessages";
import type { Category } from "@/types/transaction";

interface QuickAddBarProps {
  categories: Category[];
}

function createInitialValues(): TransactionFormValues {
  return {
    type: "EXPENSE",
    amountRaw: "",
    txnDate: todayString(),
    categoryId: null,
    merchant: "",
    memo: "",
  };
}

export function QuickAddBar({ categories }: QuickAddBarProps) {
  const [values, setValues] = useState<TransactionFormValues>(createInitialValues);
  const [serverError, setServerError] = useState<string | undefined>();
  const createMutation = useCreateTransactionMutation();
  const receiptParseMutation = useReceiptParseMutation();
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (values.categoryId === null) return;
    setServerError(undefined);
    try {
      await createMutation.mutateAsync({
        type: values.type,
        amount: Number(values.amountRaw),
        txnDate: values.txnDate,
        categoryId: values.categoryId,
        merchant: values.merchant || undefined,
        memo: values.memo || undefined,
      });
      // 저장 성공 시 날짜·구분만 유지하고 나머지는 비운다(TXN-02, 연속 입력 대비).
      setValues((prev) => ({ ...createInitialValues(), type: prev.type, txnDate: prev.txnDate }));
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? getErrorMessage(error) : "연결에 실패했습니다.");
    }
  };

  // TXN-13: 영수증 첨부. 자동 등록하지 않고 인식 결과로 폼만 채운다 — 저장은 기존 "등록" 버튼이 그대로 담당한다.
  const handleReceiptFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 파일을 다시 골라도 onChange가 또 발생하도록 초기화한다.
    if (!file) return;

    try {
      const result = await receiptParseMutation.mutateAsync(file);
      if (!result.amount && !result.categoryId && !result.merchant && !result.txnDate) {
        toast.error("영수증을 읽지 못했어요. 직접 입력해 주세요.");
        return;
      }
      // 인식하지 못한 필드는 비워둔다(TXN-13) — 기존 입력값을 이어 쓰지 않는다.
      setValues((prev) => ({
        type: "EXPENSE",
        amountRaw: result.amount != null ? String(result.amount) : "",
        txnDate: result.txnDate ?? "",
        categoryId: result.categoryId,
        merchant: result.merchant ?? "",
        memo: prev.memo,
      }));
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? getErrorMessage(error) : "영수증을 읽지 못했어요. 직접 입력해 주세요.");
    }
  };

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        거래를 등록하려면 카테고리를 먼저 만들어 주세요.{" "}
        <Link href="/settings/categories" className="text-primary underline-offset-4 hover:underline">
          설정으로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex justify-end">
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleReceiptFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={receiptParseMutation.isPending}
          onClick={() => receiptInputRef.current?.click()}
        >
          {receiptParseMutation.isPending ? "인식 중..." : "영수증 첨부"}
        </Button>
      </div>
      <TransactionForm
        idPrefix="quick-add"
        values={values}
        onChange={setValues}
        categories={categories}
        submitLabel="등록"
        isSubmitting={createMutation.isPending}
        serverError={serverError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
