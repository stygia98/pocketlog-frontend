"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLoginMutation } from "@/hooks/useAuth";
import { ApiRequestError } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errorMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    try {
      await loginMutation.mutateAsync({ email, password });
      router.push("/dashboard");
    } catch (error) {
      // 미가입 이메일과 비밀번호 오류를 구분하지 않는다(PRD.md 5.1 — 계정 존재 여부 비노출).
      if (error instanceof ApiRequestError) {
        setFormError(getErrorMessage(error, { context: "login" }));
      } else {
        setFormError("연결에 실패했습니다.");
      }
    }
  };

  return (
    <div className="reveal-stack mx-auto flex w-full max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold text-logo">포켓로그</h1>
        <p className="text-sm text-muted-foreground">로그인하고 이번 달 지출을 확인하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {formError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input
            className="h-11"
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            className="h-11"
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <Button type="submit" className="h-11 text-base" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
