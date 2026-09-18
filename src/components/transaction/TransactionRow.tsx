"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";
import { formatAmount } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function TransactionRow({ transaction, onDelete, isDeleting }: TransactionRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
      {/*
        Link의 실제 폭은 컨테이너 전체가 아니라 옆에 붙는 금액·삭제 버튼을 뺀 나머지다
        (이 div가 flex justify-between이라 그 둘이 먼저 자기 폭을 차지한다). 좁은 화면에서는
        그 나머지가 130~190px 정도뿐이라, 날짜(96px 고정)+거래처를 한 줄에 같이 두면
        거래처가 몇 글자로 잘린다. sm 미만에서는 세로로 쌓아 거래처가 이 좁은 폭을 온전히
        쓰게 하고, sm 이상에서만 기존처럼 한 줄로 합친다.
      */}
      <Link
        href={`/transactions/${transaction.id}`}
        className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
      >
        <span className="text-sm text-muted-foreground sm:w-24 sm:shrink-0">{formatDate(transaction.txnDate)}</span>
        <span className="min-w-0 truncate text-sm sm:flex-1">{transaction.merchant}</span>
      </Link>

      <span
        className={cn(
          "shrink-0 tabular-nums text-sm font-medium",
          transaction.type === "INCOME" ? "text-income" : "text-expense"
        )}
      >
        {formatAmount(transaction.amount)}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isDeleting}
        onClick={(event) => {
          // Link 클릭(상세 이동)과 겹치지 않게 막는다.
          event.preventDefault();
          event.stopPropagation();
          onDelete(transaction.id);
        }}
        aria-label="삭제"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
