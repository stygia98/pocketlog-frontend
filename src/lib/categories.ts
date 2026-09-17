import { apiClient } from "@/lib/apiClient";
import type { Category, CategoryCreateRequest, CategoryUpdateRequest } from "@/types/transaction";

// queryKeys.categories.all()에는 파라미터가 없다 — 타입별로 다시 부르면 캐시 키가 같아서
// 서로 다른 필터 결과가 뒤섞인다. 전체 목록을 한 번만 받고 화면에서 타입별로 걸러 쓴다.
export function listCategories(): Promise<Category[]> {
  return apiClient.get<Category[]>("/categories");
}

export function createCategory(body: CategoryCreateRequest): Promise<Category> {
  return apiClient.post<Category>("/categories", body);
}

export function updateCategory(id: number, body: CategoryUpdateRequest): Promise<Category> {
  return apiClient.put<Category>(`/categories/${id}`, body);
}

export function deleteCategory(id: number): Promise<void> {
  return apiClient.delete<void>(`/categories/${id}`);
}
