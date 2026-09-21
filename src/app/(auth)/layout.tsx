import { AuthShowcase } from "@/components/auth/AuthShowcase";

// 로그인·회원가입이 같은 2단 구성을 쓴다: 넓은 화면은 왼쪽 일러스트 패널 + 오른쪽 폼,
// 좁은 화면은 위쪽에 일러스트를 낮게 두고 아래에 폼을 쌓는다(모바일 우선).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[1.1fr_1fr]">
      <AuthShowcase />
      <main className="flex items-center justify-center">{children}</main>
    </div>
  );
}
