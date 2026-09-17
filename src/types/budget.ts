// 백엔드 BudgetResponse와 1:1로 맞춘 타입. 예산 미설정 카테고리는 amount가 null로 내려온다
// (BudgetService.list — 그 달에 설정된 예산만 채우고 나머지는 null).

export interface BudgetItem {
  categoryId: number;
  name: string;
  color: string;
  amount: number | null;
}
