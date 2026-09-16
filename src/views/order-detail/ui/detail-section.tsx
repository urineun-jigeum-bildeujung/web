// 주문 상세의 흰 카드 한 덩어리. 제목을 안에 두고 그 아래로 내용을 쌓는다.
// UI 시안 기준(mypa_161 302:11767 주문정보 · 1238:10060 결제상세 · 1238:10079 배송지 정보)이다.
//
// `shared/ui`의 `DetailCard`를 쓰지 않는 이유는 그쪽이 children을 `<dl>`로 감싸기 때문이다.
// 주문정보 카드에는 주문번호 쌍 옆에 상품 줄과 반품·교환 버튼이 함께 들어가는데, 둘 다
// `dl`의 자식으로 올 수 없다. `dl`을 걷어내면 `DefinitionRow`를 쓰는 다른 화면까지 손대야 해
// 이 화면 폴더에 따로 둔다.

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
    <section className={cn("flex flex-col gap-3 rounded-xl bg-card px-3 py-4", className)}>
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
