"use client";

import { ErrorArt } from "@/components/illustration/Art";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  /** 필수 prop. 재시도 동작 없는 에러 카드를 만들지 못하게 타입으로 강제한다 (ROADMAP.md Phase 7 DoD). */
  onRetry: () => void;
}

export function ErrorState({
  message = "일시적인 오류가 발생했습니다. 다시 시도해 주세요.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div aria-hidden className="reveal-once w-44">
        <ErrorArt />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
