"use client";

import { useQuery } from "@tanstack/react-query";

import { listCategories } from "@/lib/categories";
import { queryKeys } from "@/lib/queryKeys";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: listCategories,
  });
}
