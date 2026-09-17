import { Skeleton as SkeletonBase } from "@/components/ui/skeleton";

// CLAUDE.md 9장: 목록은 항목형 스켈레톤 5개, 대시보드는 카드형 스켈레톤.
// ui/skeleton은 shadcn이 준 기본 블록이고, 여기서는 화면이 바로 쓸 수 있는 패턴 두 가지로 감싼다.

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="불러오는 중">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBase key={index} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="불러오는 중">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBase key={index} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}
