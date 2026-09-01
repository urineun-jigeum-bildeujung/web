// 주문 상세의 카드 한 덩어리. 제목을 카드 안에 두고 그 아래 항목을 쌓는다.
// 와이어프레임 기준(mypa_161 주문정보·결제상세·배송지 정보)이라 디자인 확정 시 바뀔 수 있다.
//
// 마이페이지의 SettingGroup과 달리 제목이 카드 안에 있고 크다. 지금은 이 화면만 쓰므로 여기 둔다.

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type DetailCardProps = {
  title: ReactNode;
  /** 제목 오른쪽에 붙는 것. 결제 일시처럼 제목과 짝을 이루는 값. */
  titleTrailing?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DetailCard({ title, titleTrailing, children, className }: DetailCardProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-baseline justify-between gap-2 pb-2">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {titleTrailing && <span className="text-xs text-muted-foreground">{titleTrailing}</span>}
      </div>
      {/* DefinitionRow가 dt·dd를 쓰므로 목록으로 감싼다. */}
      <dl className="flex flex-col">{children}</dl>
    </section>
  );
}
