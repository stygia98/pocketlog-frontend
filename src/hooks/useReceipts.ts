"use client";

import { useMutation } from "@tanstack/react-query";

import { parseReceipt } from "@/lib/receipts";

export function useReceiptParseMutation() {
  return useMutation({
    mutationFn: (file: File) => parseReceipt(file),
  });
}
