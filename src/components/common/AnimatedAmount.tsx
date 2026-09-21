"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

import { formatAmount } from "@/lib/money";

interface AnimatedAmountProps {
  value: number;
}

// 대시보드 요약 숫자가 0에서 실제 값까지 올라간다. 화면 진입 직후 한 번만 보이는 짧은 연출(0.7s)이고,
// 끝나면 정확한 값(소수 포함 원본)으로 고정한다. prefers-reduced-motion이면 애니메이션 없이 바로 값을 보인다.
export function AnimatedAmount({ value }: AnimatedAmountProps) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: setShown,
      onComplete: () => setShown(value),
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <>{formatAmount(reduce ? value : shown)}</>;
}
