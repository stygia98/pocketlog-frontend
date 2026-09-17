"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";
import { formatAmount } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function TransactionRow({ transaction, onDelete, isDeleting }: TransactionRowProps) {
  const { category } = transaction;
  // 검증 없이 임의 문자열을 style에 넣으면 CSS 값 주입 경로가 된다(CLAUDE.md 6장 XSS 방어).
  const dotColor = HEX_COLOR_PATTERN.test(category.color) ? category.color : "var(--muted-foreground)";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <Link
        href={`/transactions/${transaction.id}`}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1"
      >
        <span className="w-24 shrink-0 text-sm text-muted-foreground">{formatDate(transaction.txnDate)}</span>
        {/* 카테고리 이름 텍스트는 색 위가 아니라 점 옆에 둔다 — 사용자 지정 색이라 대비를 계산할 수 없다(PRD.md 5.1). */}
        <span className="flex shrink-0 items-center gap-1.5 text-sm">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} aria-hidden />
          {category.name}
          {category.deleted && <span className="text-muted-foreground">(삭제됨)</span>}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">{transaction.merchant}</span>
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
