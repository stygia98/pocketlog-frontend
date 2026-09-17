"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// "/"는 화면이 아니다 — 인증 여부 판정은 (main)/layout.tsx의 가드가 이미 하므로
// 여기서는 /dashboard로 보내기만 한다(인증 상태에 따라 그쪽에서 /login으로 다시 보낸다).
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
