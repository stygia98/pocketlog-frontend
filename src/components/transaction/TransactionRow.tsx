"use client";

import { useState } from "react";
import { MapPin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TransactionEditDialog } from "@/components/transaction/TransactionEditDialog";
import { TransactionLocationDialog } from "@/components/transaction/TransactionLocationDialog";
import { formatMonthDayWeekday } from "@/lib/date";
import { formatAmount } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/types/transaction";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

// 왼쪽 원(카테고리 색 점) · 가운데 거래처+카테고리 · 오른쪽 금액+날짜 · 삭제 버튼의 4단 구성이다.
export function TransactionRow({ transaction, categories, onDelete, isDeleting }: TransactionRowProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const hasLocation = transaction.latitude !== null && transaction.longitude !== null;
  const isIncome = transaction.type === "INCOME";
  const { category } = transaction;

  // 팝업은 클릭 영역(행) 밖에 둔다. React는 포털 안의 클릭도 부모로 전달하므로, 안에 두면 팝업의 "취소"가 행 클릭으로 이어져 다시 열린다.
  return (
    <>
      <div
        onClick={() => setIsEditOpen(true)}
        className="flex cursor-pointer items-center gap-3 border-b border-border py-3 last:border-b-0"
      >
        {/* 카테고리 색은 글자 배경이 아니라 점으로만 쓴다 — 사용자 지정 색이라 대비를 계산할 수 없다(PRD.md 5.1). */}
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card"
        >
          <span
            className="size-3 rounded-full"
            style={{
              backgroundColor: HEX_COLOR_PATTERN.test(category.color) ? category.color : "var(--muted-foreground)",
            }}
          />
        </span>

        {/* 행 전체를 눌러 수정 팝업을 연다(키보드는 거래처 버튼이 받는다). 지도·삭제 버튼은 자기 동작만 하도록 전달을 막는다. */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              className={cn(
                "min-w-0 truncate border-0 bg-transparent p-0 text-left text-base",
                transaction.merchant ? "font-semibold" : "text-muted-foreground",
              )}
            >
              {transaction.merchant || "거래처 없음"}
            </button>
            {hasLocation && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                aria-label="위치 보기"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsLocationOpen(true);
                }}
              >
                <MapPin className="size-3.5" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {category.name}
            {category.deleted && " (삭제됨)"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className={cn("text-base font-semibold tabular-nums", isIncome ? "text-income" : "text-expense")}>
            {isIncome ? "+" : "-"}
            {formatAmount(transaction.amount)}원
          </p>
          <p className="text-xs text-muted-foreground">{formatMonthDayWeekday(transaction.txnDate)}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isDeleting}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(transaction.id);
          }}
          aria-label="삭제"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

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
    </>
  );
}
