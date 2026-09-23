// 제목을 안에 둔 내역 구역. 제목 아래로 내용을 쌓는다.
// UI 시안 기준(mypa_161 302:11767 주문정보 · 1238:10060 결제상세, paym_002 532:17871 결제상세)이다.
//
// **지금은 주문 완료(`paym_002`)만 쓴다.** 주문 상세는 2026-09-23 시안부터 카드 제목(18px)과
// 결제 일시(13px) 글자가 달라져 화면에서 직접 그린다. 여기를 고치면 주문 완료가 바뀐다 (#405).
//
// **카드 여부는 이 조각이 정하지 않는다.** 주문 상세(`mypa_161`)는 회색 바닥 위 흰 카드 안에
// 놓이고 주문 완료(`paym_002`)는 흰 바닥에 그대로 놓인다. 같은 제목 구조를 쓰면서 껍데기만
// 다르므로 카드가 필요한 쪽이 `className`으로 얹는다.
//
// `shared/ui`의 `DetailCard`를 쓰지 않는 이유는 그쪽이 children을 `<dl>`로 감싸기 때문이다.
// 주문정보 카드에는 주문번호 쌍 옆에 상품 줄과 반품·교환 버튼이 함께 들어가는데 둘 다
// `dl`의 자식으로 올 수 없다.

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type DetailSectionProps = {
  title: ReactNode;
  /** 제목 오른쪽에 붙는 것. 결제 일시처럼 제목과 짝을 이루는 값 */
  titleTrailing?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DetailSection({ title, titleTrailing, children, className }: DetailSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {/* 시안은 제목과 날짜의 밑선을 맞춘다. 글자 크기가 20과 14로 달라 baseline이 아니라 end다 */}
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-title-bold-20 text-foreground">{title}</h2>
        {titleTrailing && (
          <span className="text-body-regular-14 text-text-body-secondary">{titleTrailing}</span>
        )}
      </div>
      {children}
    </section>
  );
}
