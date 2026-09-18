"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSpreadsheet, LayoutDashboard, LogOut, Receipt, Wallet } from "lucide-react";

import { useAuth, useMeQuery } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 예산과 카테고리 설정을 한 페이지(/budgets)로 합쳐서 별도 "설정" 메뉴를 두지 않는다.
const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/transactions", label: "내역", icon: Receipt },
  { href: "/budgets", label: "예산·설정", icon: Wallet },
  { href: "/data", label: "데이터", icon: FileSpreadsheet },
];

export function Header() {
  const pathname = usePathname();
  const { logout } = useAuth();
  // Header는 (main) 레이아웃이 authenticated로 판정한 뒤에만 렌더되므로 항상 활성화한다.
  const { data: user } = useMeQuery(true);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="text-base font-semibold">
            포켓로그
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  pathname === item.href && "bg-muted text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* 이메일은 UserResponse에 있어도 여기서 참조하지 않는다 — DOM에 아예 존재하면 안 된다(AUTH-08). */}
            {user && <span className="text-sm font-medium">{user.nickname}</span>}
            <Button variant="ghost" size="icon" onClick={logout} aria-label="로그아웃">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background sm:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground",
                isActive && "text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
