"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { CardSkeleton } from "@/components/common/Skeleton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Header } from "@/components/layout/Header";

// middleware.ts를 쓰지 않는다 — 토큰이 localStorage에 있어 서버 미들웨어가 읽을 수 없다(CLAUDE.md 9장).
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "checking") {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <CardSkeleton count={3} />
      </div>
    );
  }

  // 리다이렉트가 완료되기 전까지 보호 콘텐츠가 한 프레임도 그려지면 안 된다(ROADMAP.md Phase 8 DoD).
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
      {/* 키보드 사용자가 매 페이지마다 메뉴를 거치지 않고 본문으로 바로 넘어가도록 한다. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        본문으로 건너뛰기
      </a>
      <Header />
      {/* 모바일 하단 탭바(fixed)에 콘텐츠가 가리지 않도록 여백을 둔다 */}
      <main id="main-content" tabIndex={-1} className="outline-none mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-8 sm:px-6 md:pb-8">{children}</main>
      <ChatWidget />
    </>
  );
}
