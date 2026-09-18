import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { QueryProvider } from "@/components/providers/QueryProvider";

// Pretendard는 Google Fonts에 없어 next/font/google로 불러올 수 없다(CLAUDE.md 8장).
// variable을 --font-sans로 지정해 globals.css의 @theme inline { --font-sans: var(--font-sans); }가
// 이 값을 그대로 집어 쓰도록 한다(별도 토큰 매핑 코드가 필요 없다).
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "포켓로그",
  description: "데이터 예측 기반 개인용 스마트 가계부",
};

// 다크모드는 class 전략(.dark)을 쓴다. 하이드레이션 전에 동기 실행되는 이 스크립트가
// localStorage에 저장된 선택값(없으면 시스템 선호)으로 <html>에 .dark를 미리 붙여, 라이트로
// 그렸다가 다크로 바뀌는 FOUC를 막는다(useTheme 훅과 짝을 이룸).
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
