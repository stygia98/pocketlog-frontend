"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPickerDialog } from "@/components/transaction/LocationPickerDialog";
import { formatAmount, parseAmount } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Category, TransactionType } from "@/types/transaction";

// 퀵 입력 바(QuickAddBar)와 상세 화면(/transactions/[id])이 그대로 재사용하는 완전 controlled 폼.
// 이 컴포넌트는 API를 모른다 — 값 보관/제출 트리거는 상위 컴포넌트가 소유한다.
export interface TransactionFormValues {
  type: TransactionType;
  /** 콤마를 제거한 원본 문자열. dirty 판정·서버 전송은 이 값을 쓴다(CLAUDE.md 8장). */
  amountRaw: string;
  txnDate: string;
  categoryId: number | null;
  merchant: string;
  memo: string;
  latitude: number | null;
  longitude: number | null;
}

interface TransactionFormProps {
  values: TransactionFormValues;
  onChange: (values: TransactionFormValues) => void;
  categories: Category[];
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string;
  onSubmit: () => void;
  showDeleteButton?: boolean;
  onDelete?: () => void;
  /** 같은 페이지에 이 폼이 여러 번 렌더될 일은 없지만, input id 충돌을 막기 위해 접두사를 받는다. */
  idPrefix?: string;
  /** 제출 버튼 옆에 추가로 둘 버튼(예: 퀵 입력 바의 영수증 첨부). 이 컴포넌트는 내용을 모른다. */
  extraActions?: React.ReactNode;
  /**
   * "inline"(기본): 퀵 입력 바·상세 페이지가 쓰는 한 줄 배치.
   * "stacked": 팝업(TransactionEditDialog)이 쓰는 세로 배치 — 필드마다 한 줄씩 차지하고
   * 지출/수입 버튼이 넓어지며 액션 버튼이 오른쪽으로 정렬된다.
   */
  layout?: "inline" | "stacked";
}

export function TransactionForm({
  values,
  onChange,
  categories,
  submitLabel,
  isSubmitting,
  serverError,
  onSubmit,
  showDeleteButton,
  onDelete,
  idPrefix = "transaction-form",
  extraActions,
  layout = "inline",
}: TransactionFormProps) {
  const isStacked = layout === "stacked";
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const categoryOptions = categories.filter((c) => c.type === values.type && !c.deleted);

  const handleTypeChange = (type: TransactionType) => {
    // 구분이 바뀌면 새 구분에 속하지 않는 카테고리 선택은 초기화한다 — TXN-05를 UI로 원천 차단한다.
    const nextCategoryId =
      values.categoryId !== null && categories.some((c) => c.id === values.categoryId && c.type === type)
        ? values.categoryId
        : null;
    onChange({ ...values, type, categoryId: nextCategoryId });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  const isSubmitDisabled =
    isSubmitting || values.categoryId === null || values.amountRaw === "" || Number(values.amountRaw) <= 0;

  return (
    <div className="flex flex-col gap-3">
      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <div className={cn("flex gap-1", isStacked && "gap-2")}>
          <Button
            type="button"
            variant={values.type === "EXPENSE" ? "default" : "outline"}
            className={cn(isStacked && "flex-1")}
            onClick={() => handleTypeChange("EXPENSE")}
          >
            지출
          </Button>
          <Button
            type="button"
            variant={values.type === "INCOME" ? "default" : "outline"}
            className={cn(isStacked && "flex-1")}
            onClick={() => handleTypeChange("INCOME")}
          >
            수입
          </Button>
        </div>

        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end",
            isStacked && "sm:flex-col sm:items-stretch"
          )}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-amount`} className={cn(!isStacked && "justify-center")}>금액</Label>
            <Input
              id={`${idPrefix}-amount`}
              type="text"
              inputMode="numeric"
              className={cn("sm:w-32", isStacked && "sm:w-full")}
              value={values.amountRaw === "" ? "" : formatAmount(values.amountRaw)}
              onChange={(event) => onChange({ ...values, amountRaw: parseAmount(event.target.value) })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-category`} className={cn(!isStacked && "justify-center")}>카테고리</Label>
            <Select
              // value에 undefined를 넘기면 Radix가 controlled에서 uncontrolled로 전환돼 마지막
              // 선택값을 그대로 남겨 버린다(리셋이 화면에 반영되지 않음) — 항상 문자열을 넘겨 controlled를 유지한다.
              value={values.categoryId !== null ? String(values.categoryId) : ""}
              onValueChange={(value) => {
                // 선택된 카테고리가 목록에서 사라지면(구분 전환 등) Radix가 빈 문자열로
                // onValueChange를 다시 쏜다 — Number("")===0이 되어 categoryId를 조용히 덮어쓰므로 무시한다.
                if (!value) return;
                onChange({ ...values, categoryId: Number(value) });
              }}
            >
              <SelectTrigger
                id={`${idPrefix}-category`}
                className={cn(
                  "w-full sm:w-36",
                  isStacked &&
                    "sm:w-full *:data-[slot=select-value]:flex-1 data-placeholder:*:data-[slot=select-value]:justify-center"
                )}
              >
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-date`} className={cn(!isStacked && "justify-center")}>날짜</Label>
            <Input
              id={`${idPrefix}-date`}
              type="date"
              className={cn("sm:w-40", isStacked && "sm:w-full")}
              value={values.txnDate}
              onChange={(event) => onChange({ ...values, txnDate: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idPrefix}-merchant`} className={cn(!isStacked && "justify-center")}>거래처</Label>
            <div className="flex items-center gap-1">
              <Input
                id={`${idPrefix}-merchant`}
                type="text"
                maxLength={100}
                className={cn("sm:w-40", isStacked && "sm:w-full")}
                value={values.merchant}
                onChange={(event) => onChange({ ...values, merchant: event.target.value })}
              />
              <Button
                type="button"
                variant={values.latitude !== null ? "default" : "outline"}
                size="icon"
                aria-label="위치 선택"
                onClick={() => setIsLocationPickerOpen(true)}
              >
                <MapPin className="h-4 w-4" />
              </Button>
              {values.latitude !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="위치 지우기"
                  onClick={() => onChange({ ...values, latitude: null, longitude: null })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className={cn("flex flex-col gap-1 sm:min-w-40 sm:flex-1", isStacked && "sm:w-full")}>
            <Label htmlFor={`${idPrefix}-memo`} className={cn(!isStacked && "justify-center")}>메모</Label>
            <Input
              id={`${idPrefix}-memo`}
              type="text"
              maxLength={500}
              value={values.memo}
              onChange={(event) => onChange({ ...values, memo: event.target.value })}
            />
          </div>

          <div className={cn("flex gap-2", isStacked && "sm:w-full sm:justify-end")}>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitting ? "저장 중..." : submitLabel}
            </Button>
            {showDeleteButton && (
              <Button type="button" variant="outline" onClick={onDelete}>
                삭제
              </Button>
            )}
            {extraActions}
          </div>
        </div>
      </form>

      <LocationPickerDialog
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        onSelect={(location) =>
          onChange({
            ...values,
            latitude: location.latitude,
            longitude: location.longitude,
            merchant: location.name,
          })
        }
      />
    </div>
  );
}
