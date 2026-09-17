"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// CLAUDE.md 8장 카테고리 팔레트. 색 미지정 시 서버가 배정하는 순서와 같다.
export const CATEGORY_PALETTE = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#4F46E5",
  "#EC4899",
  "#14B8A6",
  "#8B5CF6",
  "#F97316",
  "#737373",
];

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export interface CategoryFormValues {
  name: string;
  color: string;
  /** 배열 인덱스를 표시 순서로 취급한다 — 목록 API가 sortOrder 값을 내려주지 않는다(CategoryResponse). */
  sortOrder: number;
}

interface CategoryFormProps {
  values: CategoryFormValues;
  onChange: (values: CategoryFormValues) => void;
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string;
  onSubmit: () => void;
  onCancel: () => void;
  idPrefix: string;
}

// 카테고리 생성·수정 다이얼로그가 공유하는 완전 controlled 폼. 수정 폼은 구분(type)을 다루지
// 않으므로(CLAUDE.md 5장) 이 컴포넌트 자체가 type을 모른다 — 부모가 생성 시에만 별도로 붙인다.
export function CategoryForm({
  values,
  onChange,
  submitLabel,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
  idPrefix,
}: CategoryFormProps) {
  const trimmedName = values.name.trim();
  const isNameValid = trimmedName.length >= 1 && trimmedName.length <= 30;
  const isColorValid = HEX_COLOR_PATTERN.test(values.color);
  const isSubmitDisabled = isSubmitting || !isNameValid || !isColorValid;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitDisabled) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-name`}>이름</Label>
        <Input
          id={`${idPrefix}-name`}
          type="text"
          maxLength={30}
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-color`}>색</Label>
        <div className="flex items-center gap-2">
          <span
            className="h-7 w-7 shrink-0 rounded-full border border-border"
            style={{ backgroundColor: isColorValid ? values.color : "transparent" }}
            aria-hidden
          />
          <Input
            id={`${idPrefix}-color`}
            type="text"
            placeholder="#RRGGBB"
            className="w-28 uppercase"
            value={values.color}
            onChange={(event) => onChange({ ...values, color: event.target.value })}
            aria-invalid={values.color.length > 0 && !isColorValid}
          />
        </div>
        {values.color.length > 0 && !isColorValid && (
          <p className="text-sm text-destructive">#RRGGBB 형식으로 입력해 주세요.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-sort-order`}>표시 순서</Label>
        <Input
          id={`${idPrefix}-sort-order`}
          type="number"
          inputMode="numeric"
          className="w-24"
          value={values.sortOrder}
          onChange={(event) => onChange({ ...values, sortOrder: Number(event.target.value) })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitDisabled}>
          {isSubmitting ? "저장 중..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
