"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useMeQuery } from "@/hooks/useAuth";

// 시간대에 맞는 인사(달력의 무지출 도장과 이어지는 문구). 사용자의 로컬 시각 기준이라 클라이언트에서만 계산한다(이 컴포넌트는 인증 후에만 렌더된다).
function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 11) return "오늘의 무지출 도전해 볼까요";
  if (hour >= 11 && hour < 17) return "무지출 도장 아직 지킬 수 있어요";
  if (hour >= 17 && hour < 22) return "오늘 도장 받을 수 있을까요";
  return "하루 장부를 마감할 시간이에요";
}

// 대시보드 맨 위 한 줄. 화면의 h1(인사말)과 이 화면에서 강조하는 유일한 행동(거래 기록하기)만 둔다.
// 큰 영역은 그 아래 광고 배너(AdBannerCarousel)가 차지한다.
export function DashboardHero() {
  const { data: user } = useMeQuery(true);
  const greeting = greetingFor(new Date().getHours());

  return (
    <section className="flex items-center justify-between gap-4">
      <h1 className="min-w-0 text-xl leading-tight font-extrabold tracking-tight sm:text-2xl">
        {user ? `${user.nickname}님 ${greeting}` : greeting}
      </h1>
      <Button asChild className="shrink-0">
        <Link href="/transactions">거래 기록하기</Link>
      </Button>
    </section>
  );
}
