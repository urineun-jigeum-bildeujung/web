// 제목을 안에 둔 카드 한 덩어리. 그 아래로 항목을 쌓는다.
// 와이어프레임 기준이라 디자인 확정 시 바뀔 수 있다. 쓰는 곳은 결제(paym_001)·결제 완료(paym_002)·개발용 갤러리다.
//
// 근거로 달아 두었던 두 화면이 UI 시안에서 달라졌다. `mypa_161`(주문 상세)은 회색 바닥 위
// 무테두리 카드라 화면 쪽에서 따로 조립하고(#205), `paym_002`(결제 완료)는 카드 자체가 없어
// 흰 바닥에 내용이 그대로 놓인다. 그 화면 작업 때 이 컴포넌트의 자리를 다시 본다.
//
// 마이페이지의 SettingGroup과 달리 제목이 카드 안에 있고 크다.

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
