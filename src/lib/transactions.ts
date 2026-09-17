import { apiClient } from "@/lib/apiClient";
import type { TransactionListParams } from "@/lib/queryKeys";
import type {
  PageResponse,
  Transaction,
  TransactionCreateRequest,
  TransactionUpdateRequest,
} from "@/types/transaction";

export function listTransactions(params: TransactionListParams): Promise<PageResponse<Transaction>> {
  return apiClient.get<PageResponse<Transaction>>("/transactions", { ...params });
}

export function createTransaction(body: TransactionCreateRequest): Promise<Transaction> {
  return apiClient.post<Transaction>("/transactions", body);
}

export function getTransaction(id: number): Promise<Transaction> {
  return apiClient.get<Transaction>(`/transactions/${id}`);
}

export function updateTransaction(id: number, body: TransactionUpdateRequest): Promise<Transaction> {
  return apiClient.put<Transaction>(`/transactions/${id}`, body);
}

export function deleteTransaction(id: number): Promise<void> {
  return apiClient.delete<void>(`/transactions/${id}`);
}
