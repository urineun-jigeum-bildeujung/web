// 목록 줄 여러 개를 제목 아래 카드로 묶는다. 마이페이지 메뉴가 이 단위로 나뉜다.
// 와이어프레임 기준(mypa_001 "나의 쇼핑"·"혜택과 결제"·"고객지원")이라 디자인 확정 시 바뀔 수 있다.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type SettingGroupProps = {
  /** 묶음 제목. 없으면 카드만 그린다 */
  title?: ReactNode;
  children: ReactNode;
} & ComponentProps<"section">;

export function SettingGroup({ title, children, className, ...props }: SettingGroupProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)} {...props}>
      {title && <h2 className="px-4 text-sm font-semibold text-muted-foreground">{title}</h2>}
      {/* 줄 사이 구분선은 첫 줄을 뺀 나머지에만 넣는다 */}
      <div className="overflow-hidden rounded-xl border border-border bg-card [&>*+*]:border-t [&>*+*]:border-border">
        {children}
      </div>
    </section>
  );
}
