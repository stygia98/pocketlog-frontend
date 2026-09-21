"use client";

import Link from "next/link";

import { PocketArt } from "@/components/illustration/Art";
import { GRAIN, GRAIN_CLASS, PAPER_BACKGROUND } from "@/components/illustration/paper";
import { Button } from "@/components/ui/button";
import { useMeQuery } from "@/hooks/useAuth";

// 시간대에 맞는 인사(달력의 무지출 도장과 이어지는 문구). 사용자의 로컬 시각 기준이라 클라이언트에서만 계산한다(이 컴포넌트는 인증 후에만 렌더된다).
function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 11) return "오늘의 무지출 도전해 볼까요";
  if (hour >= 11 && hour < 17) return "무지출 도장 아직 지킬 수 있어요";
  if (hour >= 17 && hour < 22) return "오늘 도장 받을 수 있을까요";
  return "하루 장부를 마감할 시간이에요";
}

// 대시보드 맨 위. 매일 여는 화면의 첫인상이자, 이 화면에서 강조하는 유일한 행동(거래 기록하기)이다.
export function DashboardHero() {
  const { data: user } = useMeQuery(true);
  const greeting = greetingFor(new Date().getHours());

  return (
    <section
      className="relative isolate overflow-hidden rounded-2xl border border-border px-6 py-6 sm:px-8 sm:py-4"
      style={{ background: PAPER_BACKGROUND }}
    >
      <div aria-hidden className={GRAIN_CLASS} style={{ backgroundImage: GRAIN }} />
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
            {user ? `${user.nickname}님 ${greeting}` : greeting}
          </h1>
          <p className="mt-2 max-w-sm text-muted-foreground">오늘 쓴 돈은 3초면 기록할 수 있어요.</p>
          <Button asChild className="mt-5">
            <Link href="/transactions">거래 기록하기</Link>
          </Button>
        </div>
        <div aria-hidden className="hidden w-48 shrink-0 sm:block lg:w-64">
          <PocketArt />
        </div>
      </div>
    </section>
  );
}
