"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateNicknameMutation } from "@/hooks/useAuth";
import { ApiRequestError } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errorMessages";

const MAX_LENGTH = 50;

interface NicknameDialogProps {
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// AUTH-10. 헤더의 닉네임을 누르면 열린다. 이메일·비밀번호는 여기서 바꾸지 않는다.
export function NicknameDialog({ nickname, open, onOpenChange }: NicknameDialogProps) {
  const [value, setValue] = useState(nickname);
  const [serverError, setServerError] = useState<string | undefined>();
  const mutation = useUpdateNicknameMutation();

  // 다이얼로그는 헤더에 상시 마운트돼 있어, 열 때마다 현재 닉네임으로 다시 채운다.
  useEffect(() => {
    if (!open) return;
    setValue(nickname);
    setServerError(undefined);
  }, [open, nickname]);

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && trimmed !== nickname && !mutation.isPending;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setServerError(undefined);
    try {
      await mutation.mutateAsync(trimmed);
      onOpenChange(false);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? getErrorMessage(error) : "연결에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>닉네임 변경</DialogTitle>
          <DialogDescription>대시보드 인사말과 헤더에 이 이름이 보여요.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nickname-input">닉네임</Label>
            <Input
              id="nickname-input"
              value={value}
              maxLength={MAX_LENGTH}
              autoFocus
              onChange={(event) => setValue(event.target.value)}
              aria-invalid={serverError ? true : undefined}
            />
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {mutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
