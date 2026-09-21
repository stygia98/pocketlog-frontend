"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { FileSpreadsheet, LayoutDashboard, LogOut, Moon, Receipt, Sun, Wallet } from "lucide-react";

import { useAuth, useMeQuery } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { NicknameDialog } from "@/components/layout/NicknameDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 예산과 카테고리 설정을 한 페이지(/budgets)로 합쳐서 별도 "설정" 메뉴를 두지 않는다.
const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/transactions", label: "내역", icon: Receipt },
  { href: "/budgets", label: "예산·설정", icon: Wallet },
  { href: "/data", label: "내역관리", icon: FileSpreadsheet },
];

export function Header() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  // Header는 (main) 레이아웃이 authenticated로 판정한 뒤에만 렌더되므로 항상 활성화한다.
  const { data: user } = useMeQuery(true);
  const [isNicknameOpen, setIsNicknameOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* 로고와 메뉴를 한 묶음으로 왼쪽에 붙인다. 오른쪽은 닉네임·테마·로그아웃 묶음이 차지한다. */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-heading text-lg font-bold text-logo">
              포켓로그
            </Link>

            <nav aria-label="주 메뉴" className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 pointer-coarse:py-2.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground",
                    pathname === item.href && "font-medium text-foreground",
                  )}
                >
                  {pathname === item.href && (
                    // layoutId가 같아 라우트가 바뀌면 이 알약이 이전 메뉴에서 새 메뉴로 미끄러져 이동한다.
                    <motion.span
                      layoutId="nav-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-primary/14"
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* 이메일은 UserResponse에 있어도 여기서 참조하지 않는다 — DOM에 아예 존재하면 안 된다(AUTH-08). */}
            {user && (
              // 누르면 닉네임 변경 팝업(AUTH-10). 이메일은 여기서도 쓰지 않는다.
              <button
                type="button"
                onClick={() => setIsNicknameOpen(true)}
                aria-label={`닉네임 변경 (현재 ${user.nickname})`}
                title="닉네임 변경"
                className="max-w-40 truncate rounded-md px-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none pointer-coarse:min-h-11"
              >
                {user.nickname}님
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="로그아웃">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <nav
        aria-label="하단 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground",
                isActive && "text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && <NicknameDialog nickname={user.nickname} open={isNicknameOpen} onOpenChange={setIsNicknameOpen} />}
    </>
  );
}
