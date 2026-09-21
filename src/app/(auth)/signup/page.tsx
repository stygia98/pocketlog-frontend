"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLoginMutation, useSignupMutation } from "@/hooks/useAuth";
import { ApiRequestError } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errorMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_BYTES = 72;
const PASSWORD_HELP_TEXT =
  "비밀번호는 6자 이상, 72바이트 이하여야 합니다. 한글은 1자가 3바이트로 계산됩니다.";

export default function SignupPage() {
  const router = useRouter();
  const signupMutation = useSignupMutation();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // pw.length는 문자 수라 한글 25자(75바이트)를 통과시킨다 — 반드시 바이트로 잰다(CLAUDE.md 4장).
  const passwordByteLength = useMemo(() => new TextEncoder().encode(password).length, [password]);
  const isPasswordInvalid =
    password.length > 0 && (password.length < MIN_PASSWORD_LENGTH || passwordByteLength > MAX_PASSWORD_BYTES);

  const isPending = signupMutation.isPending || loginMutation.isPending;
  const isSubmitDisabled =
    password.length < MIN_PASSWORD_LENGTH || passwordByteLength > MAX_PASSWORD_BYTES || isPending;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setEmailError(null);
    setFormError(null);
    try {
      await signupMutation.mutateAsync({ email, password, nickname });
      // 백엔드 signup 응답에는 토큰이 없다 — 같은 자격증명으로 로그인을 이어서 호출해야 자동 로그인이 된다.
      await loginMutation.mutateAsync({ email, password });
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === "EMAIL_DUPLICATED") {
          setEmailError(getErrorMessage(error));
        } else {
          setFormError(getErrorMessage(error));
        }
      } else {
        setFormError("연결에 실패했습니다.");
      }
    }
  };

  return (
    <div className="reveal-stack mx-auto flex w-full max-w-sm flex-col justify-center gap-5 px-4 py-5 lg:gap-8 lg:py-12">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold text-logo">회원가입</h1>
        <p className="text-sm text-muted-foreground">가입하면 기본 카테고리 9개가 자동으로 만들어져요.</p>
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
            aria-invalid={emailError ? true : undefined}
          />
          {emailError && <p className="text-sm text-destructive">{emailError}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            className="h-11"
            id="nickname"
            type="text"
            autoComplete="nickname"
            required
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            className="h-11"
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={isPasswordInvalid ? true : undefined}
          />
          {isPasswordInvalid && <p className="text-sm text-destructive">{PASSWORD_HELP_TEXT}</p>}
        </div>

        <Button type="submit" className="h-11 text-base" disabled={isSubmitDisabled}>
          {isPending ? "가입 중..." : "회원가입"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
