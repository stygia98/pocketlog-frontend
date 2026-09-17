"use client";

import { useState } from "react";
import Link from "next/link";

import { TransactionForm, type TransactionFormValues } from "@/components/transaction/TransactionForm";
import { useCreateTransactionMutation } from "@/hooks/useTransactions";
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
