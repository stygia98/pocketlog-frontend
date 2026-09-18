"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { TransactionRow } from "@/components/transaction/TransactionRow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteTransactionMutation } from "@/hooks/useTransactions";
import { formatAmount } from "@/lib/money";
import type { Category, Transaction } from "@/types/transaction";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  /** 삭제 후 이 페이지가 비면(마지막 한 건이었으면) 호출된다. 실제 페이지 이동은 부모가 처리한다. */
  onDeletedLastItem: () => void;
}

export function TransactionList({ transactions, categories, onDeletedLastItem }: TransactionListProps) {
  const deleteMutation = useDeleteTransactionMutation();
  const shouldReduceMotion = useReducedMotion();
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const wasLastItemOnPage = transactions.length === 1;
    // 페이지 이동은 onMutate가 아니라 onSuccess에서 한다 — onMutate에서 이동하면 실패 시
    // onError 롤백이 사용자가 더 이상 보고 있지 않은 캐시에 적용된다(CLAUDE.md 9장).
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        if (wasLastItemOnPage) onDeletedLastItem();
      },
    });
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col">
      <AnimatePresence initial={false}>
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            layout={!shouldReduceMotion}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: shouldReduceMotion ? 0 : index * 0.03 } }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <TransactionRow
              transaction={transaction}
              categories={categories}
              onDelete={() => setDeleteTarget(transaction)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === transaction.id}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>삭제하시겠습니까?</DialogTitle>
            {deleteTarget && (
              <DialogDescription>
                {deleteTarget.txnDate} · {deleteTarget.category.name}
                {deleteTarget.merchant ? ` · ${deleteTarget.merchant}` : ""} · {formatAmount(deleteTarget.amount)}원
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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
