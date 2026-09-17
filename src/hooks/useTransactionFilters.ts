"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TransactionType } from "@/types/transaction";

export interface TransactionFiltersState {
  page: number;
  type?: TransactionType;
  categoryId?: number;
  from?: string;
  to?: string;
  keyword?: string;
}

const FILTER_KEYS = ["type", "categoryId", "from", "to", "keyword"] as const;

// 필터·검색·페이지를 전부 URL 쿼리로 관리한다(CLAUDE.md 9장) — 새로고침·뒤로가기로 유지되고
// 링크 공유가 된다. push를 쓴다(replace 아님) — 뒤로가기로 이전 필터 조합을 되짚을 수 있어야 한다.
export function useTransactionFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: TransactionFiltersState = {
    page: Number(searchParams.get("page")) || 0,
    type: (searchParams.get("type") as TransactionType | null) ?? undefined,
    categoryId: searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    keyword: searchParams.get("keyword") ?? undefined,
  };

  const setFilter = (partial: Partial<TransactionFiltersState>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(partial).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    // 필터가 바뀌면 첫 페이지로 되돌린다 — 호출자가 page를 명시적으로 함께 넘긴 경우는 존중한다.
    const isFilterKeyChanged = FILTER_KEYS.some((key) => key in partial);
    if (isFilterKeyChanged && !("page" in partial)) {
      params.set("page", "0");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = FILTER_KEYS.some((key) => filters[key] !== undefined);

  return { filters, setFilter, resetFilters, hasActiveFilters };
}
