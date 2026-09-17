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

export function TransactionFilters({ categories }: TransactionFiltersProps) {
  const { filters, setFilter } = useTransactionFilters();
  // 키워드는 입력할 때마다 URL을 바꾸지 않는다 — 매 키입력이 히스토리 항목이 되는 걸 막는다.
  const [keywordInput, setKeywordInput] = useState(filters.keyword ?? "");

  const handleKeywordSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFilter({ keyword: keywordInput || undefined });
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-from">시작일</Label>
        <Input
          id="filter-from"
          type="date"
          className="w-full sm:w-40"
          value={filters.from ?? ""}
          onChange={(event) => setFilter({ from: event.target.value || undefined })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-to">종료일</Label>
        <Input
          id="filter-to"
          type="date"
          className="w-full sm:w-40"
          value={filters.to ?? ""}
          onChange={(event) => setFilter({ to: event.target.value || undefined })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-type">구분</Label>
        <Select
          value={filters.type ?? ALL}
          onValueChange={(value) => setFilter({ type: value === ALL ? undefined : (value as TransactionType) })}
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
          value={filters.categoryId !== undefined ? String(filters.categoryId) : ALL}
          onValueChange={(value) => setFilter({ categoryId: value === ALL ? undefined : Number(value) })}
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

      <form onSubmit={handleKeywordSubmit} className="col-span-2 flex flex-col gap-1 sm:min-w-40 sm:flex-1">
        <Label htmlFor="filter-keyword">검색</Label>
        <div className="flex gap-1">
          <Input
            id="filter-keyword"
            type="text"
            placeholder="거래처, 메모"
            className="flex-1"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
          />
          <Button type="submit" variant="outline" size="icon" aria-label="검색">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
