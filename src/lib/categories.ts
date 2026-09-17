import { apiClient } from "@/lib/apiClient";
import type { Category } from "@/types/transaction";

// queryKeys.categories.all()에는 파라미터가 없다 — 타입별로 다시 부르면 캐시 키가 같아서
// 서로 다른 필터 결과가 뒤섞인다. 전체 목록을 한 번만 받고 화면에서 타입별로 걸러 쓴다.
export function listCategories(): Promise<Category[]> {
  return apiClient.get<Category[]>("/categories");
}
