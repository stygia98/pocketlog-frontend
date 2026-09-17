"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  /** 0부터 시작 (CLAUDE.md 5장 목록 쿼리 파라미터 page 규약과 동일). */
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// CLAUDE.md 9장: 현재 페이지 주변 10개 + 처음/이전/다음/마지막. 페이지 수 1 이하면 렌더링하지 않음.
// 모바일은 "3 / 12" 형태로 축약.
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const windowSize = 10;
  const windowStart = Math.max(0, Math.min(currentPage - 2, totalPages - windowSize));
  const windowEnd = Math.min(totalPages, windowStart + windowSize);
  const pages = Array.from({ length: windowEnd - windowStart }, (_, i) => windowStart + i);

  const isFirst = currentPage === 0;
  const isLast = currentPage >= totalPages - 1;

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지네이션">
      <Button variant="ghost" size="icon" disabled={isFirst} onClick={() => onPageChange(0)} aria-label="처음으로">
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={isFirst}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "ghost"}
            size="icon"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page + 1}
          </Button>
        ))}
      </div>

      <span className="px-2 text-sm tabular-nums text-muted-foreground sm:hidden">
        {currentPage + 1} / {totalPages}
      </span>

      <Button
        variant="ghost"
        size="icon"
        disabled={isLast}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={isLast}
        onClick={() => onPageChange(totalPages - 1)}
        aria-label="마지막으로"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
