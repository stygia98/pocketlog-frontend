import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** components/illustration/Art의 일러스트. 장식이라 스크린 리더에는 숨긴다. */
  art?: ReactNode;
}

// 화면마다 h1을 하나 두고(시맨틱), 오른쪽에 그 화면을 상징하는 일러스트를 작게 곁들인다.
export function PageHeader({ title, description, art }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {art && (
        <div aria-hidden className="-my-3 w-28 shrink-0 sm:w-40">
          {art}
        </div>
      )}
    </header>
  );
}
