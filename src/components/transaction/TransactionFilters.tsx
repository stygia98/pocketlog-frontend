"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

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
import { useTransactionFilters } from "@/hooks/useTransactionFilters";
import type { Category, TransactionType } from "@/types/transaction";

interface TransactionFiltersProps {
  categories: Category[];
}

const ALL = "ALL";

interface DraftFilters {
  from: string;
  to: string;
  type: TransactionType | typeof ALL;
  categoryId: string;
  keyword: string;
}

function toDraft(filters: ReturnType<typeof useTransactionFilters>["filters"]): DraftFilters {
  return {
    from: filters.from ?? "",
    to: filters.to ?? "",
    type: filters.type ?? ALL,
    categoryId: filters.categoryId !== undefined ? String(filters.categoryId) : ALL,
    keyword: filters.keyword ?? "",
  };
}

// 필터는 선택할 때마다 바로 조회되지 않는다 — 전부 로컬 상태(draft)로만 들고 있다가
// 검색 버튼(또는 폼 안에서 Enter)을 눌러야 한 번에 URL(=실제 조회 조건)에 반영한다.
// 부모(transactions/page.tsx)가 필터 값이 바뀔 때마다 이 컴포넌트를 key로 리마운트해줘서,
// "검색 결과 초기화" 버튼이나 뒤로가기로 URL이 바뀌었을 때도 draft가 새 값으로 다시 초기화된다.
export function TransactionFilters({ categories }: TransactionFiltersProps) {
  const { filters, setFilter } = useTransactionFilters();
  const [draft, setDraft] = useState<DraftFilters>(() => toDraft(filters));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFilter({
      from: draft.from || undefined,
      to: draft.to || undefined,
      type: draft.type === ALL ? undefined : (draft.type as TransactionType),
      categoryId: draft.categoryId === ALL ? undefined : Number(draft.categoryId),
      keyword: draft.keyword || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-from">시작일</Label>
        <Input
          id="filter-from"
          type="date"
          className="w-full sm:w-40"
          value={draft.from}
          onChange={(event) => setDraft((prev) => ({ ...prev, from: event.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-to">종료일</Label>
        <Input
          id="filter-to"
          type="date"
          className="w-full sm:w-40"
          value={draft.to}
          onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-type">구분</Label>
        <Select
          value={draft.type}
          onValueChange={(value) => setDraft((prev) => ({ ...prev, type: value as TransactionType | typeof ALL }))}
        >
          <SelectTrigger id="filter-type" className="w-full sm:w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체</SelectItem>
            <SelectItem value="EXPENSE">지출</SelectItem>
            <SelectItem value="INCOME">수입</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-category">카테고리</Label>
        <Select
          value={draft.categoryId}
          onValueChange={(value) => setDraft((prev) => ({ ...prev, categoryId: value }))}
        >
          <SelectTrigger id="filter-category" className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체</SelectItem>
            {categories
              .filter((c) => !c.deleted)
              .map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2 flex flex-col gap-1 sm:min-w-40 sm:flex-1">
        <Label htmlFor="filter-keyword">검색</Label>
        <div className="flex gap-1">
          <Input
            id="filter-keyword"
            type="text"
            placeholder="거래처, 메모"
            className="flex-1"
            value={draft.keyword}
            onChange={(event) => setDraft((prev) => ({ ...prev, keyword: event.target.value }))}
          />
          <Button type="submit" variant="outline" size="icon" aria-label="검색">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
