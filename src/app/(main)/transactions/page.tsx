"use client";

import { Suspense, useEffect } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { InfiniteScrollSentinel } from "@/components/common/InfiniteScrollSentinel";
import { ListSkeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { QuickAddBar } from "@/components/transaction/QuickAddBar";
import { TransactionFilters } from "@/components/transaction/TransactionFilters";
import { TransactionList } from "@/components/transaction/TransactionList";
import { useCategoriesQuery } from "@/hooks/useCategories";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTransactionFilters } from "@/hooks/useTransactionFilters";
import { useInfiniteTransactionListQuery, useTransactionListQuery } from "@/hooks/useTransactions";

const PAGE_SIZE = 15;

function TransactionsPageContent() {
  const { filters, setFilter, resetFilters, hasActiveFilters } = useTransactionFilters();
  const isMobile = useIsMobile();
  const categoriesQuery = useCategoriesQuery();

  const filtersWithoutPage = {
    type: filters.type,
    categoryId: filters.categoryId,
    from: filters.from,
    to: filters.to,
    keyword: filters.keyword,
  };

  // 모바일(무한 스크롤)과 데스크톱(페이지네이션)은 동시에 마운트하지 않는다 — isMobile이
  // 판정되기 전(null)에는 둘 다 꺼서 같은 데이터를 두 방식으로 중복 요청하지 않는다.
  const pageQuery = useTransactionListQuery({ ...filters, size: PAGE_SIZE }, { enabled: isMobile === false });
  const infiniteQuery = useInfiniteTransactionListQuery(
    { ...filtersWithoutPage, size: PAGE_SIZE },
    { enabled: isMobile === true }
  );

  const isLoading =
    isMobile === null || categoriesQuery.isLoading || (isMobile ? infiniteQuery.isLoading : pageQuery.isLoading);
  const isError = categoriesQuery.isError || (isMobile ? infiniteQuery.isError : pageQuery.isError);

  const transactions = isMobile
    ? (infiniteQuery.data?.pages.flatMap((page) => page.content) ?? [])
    : (pageQuery.data?.content ?? []);
  const totalElements = isMobile
    ? (infiniteQuery.data?.pages[0]?.totalElements ?? 0)
    : (pageQuery.data?.totalElements ?? 0);

  const isEmptyWithoutFilters = !isLoading && totalElements === 0 && !hasActiveFilters;

  // 거래가 없는 계정은 퀵 입력 바로 바로 입력을 시작할 수 있게 금액 필드에 포커스를 옮긴다(UX-02).
  useEffect(() => {
    if (isEmptyWithoutFilters) {
      document.getElementById("quick-add-amount")?.focus();
    }
  }, [isEmptyWithoutFilters]);

  if (isLoading) {
    return <ListSkeleton count={5} />;
  }

  if (isError) {
    return (
      <ErrorState
        onRetry={() => {
          categoriesQuery.refetch();
          if (isMobile) infiniteQuery.refetch();
          else pageQuery.refetch();
        }}
      />
    );
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <QuickAddBar categories={categories} />

      <div className="rounded-xl border border-border bg-card p-4">
        {/* 필터 값이 바뀌면(검색 제출·필터 초기화·뒤로가기) 리마운트해 내부 draft 상태를
            새 URL 값으로 다시 초기화한다 — 그 전까지는 draft가 그대로 유지돼 입력 중 검색이 안 된다. */}
        <TransactionFilters key={JSON.stringify(filtersWithoutPage)} categories={categories} />
      </div>

      {totalElements === 0 ? (
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
        <div className="rounded-xl border border-border bg-card p-4">
          <TransactionList
            transactions={transactions}
            categories={categories}
            onDeletedLastItem={() => {
              if (!isMobile && filters.page > 0) setFilter({ page: filters.page - 1 });
            }}
          />
          {isMobile && infiniteQuery.hasNextPage && (
            <>
              <InfiniteScrollSentinel
                enabled={infiniteQuery.hasNextPage}
                resetKey={infiniteQuery.data?.pages.length ?? 0}
                onIntersect={() => {
                  if (!infiniteQuery.isFetchingNextPage) infiniteQuery.fetchNextPage();
                }}
              />
              {infiniteQuery.isFetchingNextPage && (
                <p className="py-3 text-center text-sm text-muted-foreground">불러오는 중...</p>
              )}
            </>
          )}
        </div>
      )}

      {!isMobile && totalElements > 0 && (
        <Pagination
          currentPage={pageQuery.data?.page ?? 0}
          totalPages={pageQuery.data?.totalPages ?? 0}
          onPageChange={(page) => setFilter({ page })}
        />
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
