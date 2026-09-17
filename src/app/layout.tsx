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
  title: "머니로그",
  description: "데이터 예측 기반 개인용 스마트 가계부",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
