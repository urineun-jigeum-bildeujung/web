// 목록 줄 여러 개를 제목 아래 카드로 묶는다. 마이페이지 메뉴가 이 단위로 나뉜다.
// UI 시안 기준(mypa_001 "나의 쇼핑"·"혜택과 결제"·"고객지원")이다. 흰 카드, 모서리 12, 안쪽 12/16.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type SettingGroupProps = {
  /** 묶음 제목. 없으면 카드만 그린다 */
  title?: ReactNode;
  children: ReactNode;
} & ComponentProps<"section">;

export function SettingGroup({ title, children, className, ...props }: SettingGroupProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-card px-3 py-4 text-card-foreground",
        className,
      )}
      {...props}
    >
      {title && <h2 className="text-title-bold-16 text-foreground">{title}</h2>}
      {/* 시안은 줄 사이에 선이 없고 12px 간격이다 */}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
