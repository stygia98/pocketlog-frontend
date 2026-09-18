"use client";

import { useState } from "react";
import { MapPin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TransactionEditDialog } from "@/components/transaction/TransactionEditDialog";
import { TransactionLocationDialog } from "@/components/transaction/TransactionLocationDialog";
import { formatDate } from "@/lib/date";
import { formatAmount } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/types/transaction";

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function TransactionRow({ transaction, categories, onDelete, isDeleting }: TransactionRowProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const hasLocation = transaction.latitude !== null && transaction.longitude !== null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
      {/*
        이 버튼의 실제 폭은 컨테이너 전체가 아니라 옆에 붙는 금액·삭제 버튼을 뺀 나머지다
        (이 div가 flex justify-between이라 그 둘이 먼저 자기 폭을 차지한다). 좁은 화면에서는
        그 나머지가 130~190px 정도뿐이라, 날짜(96px 고정)+거래처를 한 줄에 같이 두면
        거래처가 몇 글자로 잘린다. sm 미만에서는 세로로 쌓아 거래처가 이 좁은 폭을 온전히
        쓰게 하고, sm 이상에서만 기존처럼 한 줄로 합친다.
      */}
      <button
        type="button"
        onClick={() => setIsEditOpen(true)}
        className="flex min-w-0 flex-1 flex-col gap-1 border-0 bg-transparent p-0 text-left sm:flex-row sm:items-center sm:gap-3"
      >
        <span className="text-sm text-muted-foreground sm:w-24 sm:shrink-0">{formatDate(transaction.txnDate)}</span>
        <span className="flex min-w-0 items-center gap-1 sm:flex-1">
          <span className="min-w-0 truncate text-sm">{transaction.merchant}</span>
          {hasLocation && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              aria-label="위치 보기"
              onClick={(event) => {
                event.stopPropagation();
                setIsLocationOpen(true);
              }}
            >
              <MapPin className="h-3.5 w-3.5" />
            </Button>
          )}
        </span>
      </button>

      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
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
        onClick={() => onDelete(transaction.id)}
        aria-label="삭제"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {hasLocation && (
        <TransactionLocationDialog
          open={isLocationOpen}
          onOpenChange={setIsLocationOpen}
          label={transaction.merchant ?? "위치"}
          latitude={transaction.latitude as number}
          longitude={transaction.longitude as number}
        />
      )}

      <TransactionEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        transaction={transaction}
        categories={categories}
        onDelete={() => onDelete(transaction.id)}
      />
    </div>
  );
}
