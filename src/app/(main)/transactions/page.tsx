"use client";

import { Suspense, useEffect } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { QuickAddBar } from "@/components/transaction/QuickAddBar";
import { TransactionFilters } from "@/components/transaction/TransactionFilters";
import { TransactionList } from "@/components/transaction/TransactionList";
import { useCategoriesQuery } from "@/hooks/useCategories";
import { useTransactionFilters } from "@/hooks/useTransactionFilters";
import { useTransactionListQuery } from "@/hooks/useTransactions";

const PAGE_SIZE = 20;

function TransactionsPageContent() {
  const { filters, setFilter, resetFilters, hasActiveFilters } = useTransactionFilters();
  const categoriesQuery = useCategoriesQuery();
  const listQuery = useTransactionListQuery({ ...filters, size: PAGE_SIZE });

  const isEmptyWithoutFilters = listQuery.data?.totalElements === 0 && !hasActiveFilters;

  // 거래가 없는 계정은 퀵 입력 바로 바로 입력을 시작할 수 있게 금액 필드에 포커스를 옮긴다(UX-02).
  useEffect(() => {
    if (isEmptyWithoutFilters) {
      document.getElementById("quick-add-amount")?.focus();
    }
  }, [isEmptyWithoutFilters]);

  if (categoriesQuery.isLoading || listQuery.isLoading) {
    return <ListSkeleton count={5} />;
  }

  if (categoriesQuery.isError || listQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          categoriesQuery.refetch();
          listQuery.refetch();
        }}
      />
    );
  }

  const categories = categoriesQuery.data ?? [];
  const list = listQuery.data;
  if (!list) return null;

  return (
    <div className="flex flex-col gap-6">
      <QuickAddBar categories={categories} />
      <TransactionFilters categories={categories} />

      {list.totalElements === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="조건에 맞는 내역이 없어요"
            action={
              <Button variant="outline" onClick={resetFilters}>
                필터 초기화
              </Button>
            }
          />
        ) : (
          <EmptyState title="아직 기록이 없어요" description="퀵 입력 바에서 첫 거래를 남겨보세요." />
        )
      ) : (
        <>
          <TransactionList
            transactions={list.content}
            onDeletedLastItem={() => {
              if (filters.page > 0) setFilter({ page: filters.page - 1 });
            }}
          />
          <Pagination
            currentPage={list.page}
            totalPages={list.totalPages}
            onPageChange={(page) => setFilter({ page })}
          />
        </>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  // useSearchParams(useTransactionFilters 내부)를 쓰는 컴포넌트는 Suspense로 감싸야 빌드가 통과한다(Next15).
  return (
    <Suspense fallback={<ListSkeleton count={5} />}>
      <TransactionsPageContent />
    </Suspense>
  );
}
