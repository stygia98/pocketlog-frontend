import { apiClient } from "@/lib/apiClient";
import type { ReceiptParseResult } from "@/types/receipt";

export function parseReceipt(file: File): Promise<ReceiptParseResult> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.upload<ReceiptParseResult>("/receipts/parse", formData);
}
