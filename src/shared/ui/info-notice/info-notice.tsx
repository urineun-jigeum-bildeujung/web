// 화면 위쪽에서 정책이나 주의사항을 불릿으로 알린다.
// 와이어프레임 기준(mypa_031)이라 디자인 확정 시 바뀔 수 있다.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type InfoNoticeProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** 불릿으로 나열할 안내 문장들 */
  items: ReactNode[];
} & ComponentProps<"section">;

export function InfoNotice({ title, description, items, className, ...props }: InfoNoticeProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)} {...props}>
      {title && <h2 className="text-base font-bold text-foreground">{title}</h2>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
