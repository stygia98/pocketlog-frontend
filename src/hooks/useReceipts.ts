"use client";

import { useMutation } from "@tanstack/react-query";

import { parseReceipt } from "@/lib/receipts";
import type { Category } from "@/types/transaction";

export function useReceiptParseMutation() {
  return useMutation({
    mutationFn: ({ file, categories }: { file: File; categories: Category[] }) => parseReceipt(file, categories),
  });
}
