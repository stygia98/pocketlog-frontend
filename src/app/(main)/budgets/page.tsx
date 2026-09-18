"use client";

import { Suspense } from "react";

import { BudgetSection } from "@/components/budget/BudgetSection";
import { ListSkeleton } from "@/components/common/Skeleton";
import { CategorySection } from "@/components/settings/CategorySection";

// 예산과 카테고리 관리는 둘 다 "지출 카테고리를 어떻게 쓸지" 설정하는 화면이라 한 페이지로 합쳤다.
// 두 섹션은 각자 독립된 쿼리·폼 상태를 갖는다 — 화면만 같이 둘 뿐 서로 아무것도 공유하지 않는다.
export default function BudgetsPage() {
  // BudgetSection이 쓰는 useBudgetMonth 안에 useSearchParams가 있어 Suspense가 필요하다(Next15).
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">예산</p>
        <Suspense fallback={<ListSkeleton count={5} />}>
          <BudgetSection />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <p className="text-sm text-muted-foreground">카테고리 관리</p>
        <CategorySection />
      </section>
    </div>
  );
}
