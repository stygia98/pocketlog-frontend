"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollSentinelProps {
  onIntersect: () => void;
  enabled: boolean;
  /**
   * 새 페이지가 로드될 때마다 바뀌는 값(예: 로드된 페이지 수)을 넘긴다. 이 값이 바뀔 때만
   * observer를 재구독해 현재 교차 상태를 다시 확인한다 — sentinel이 뷰포트를 벗어난 적 없이
   * 계속 보이는 상태로 남아 있으면 IntersectionObserver는 "상태 변화가 없다"고 보고 콜백을
   * 다시 보내지 않는다(스펙상 정상 동작). onIntersect를 그대로 deps에 넣어 매 렌더 재구독하면
   * 이 문제는 피하지만 대신 렌더마다 재구독돼 같은 페이지가 중복 요청되는 문제가 생긴다 —
   * 실제로 재현된 버그라 resetKey로 "데이터가 실제로 바뀐 시점"에만 재구독하도록 좁힌다.
   */
  resetKey: number;
}

// 뷰포트에 들어오는 순간 onIntersect를 호출하는 빈 엘리먼트. 목록 맨 아래에 두면 무한 스크롤이 된다.
export function InfiniteScrollSentinel({ onIntersect, enabled, resetKey }: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;

  useEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersectRef.current();
      },
      { rootMargin: "200px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, resetKey]);

  return <div ref={ref} aria-hidden />;
}
