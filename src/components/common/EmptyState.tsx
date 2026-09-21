import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  /** 일러스트가 있으면 아이콘 대신 이것을 보여준다(components/illustration/Art). */
  art?: React.ReactNode;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// CLAUDE.md 9장: 빈 상태 = 아이콘 + 문구 + CTA. "거래 없음"·"검색 결과 없음"·
// "카테고리 없음" 등 화면마다 title/description/action만 바꿔 재사용한다.
export function EmptyState({ art, icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {art ? (
        <div aria-hidden className="reveal-once w-44">
          {art}
        </div>
      ) : (
        <Icon className="h-10 w-10 text-muted-foreground" aria-hidden />
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
