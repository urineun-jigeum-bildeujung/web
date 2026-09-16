// 이름과 값 한 줄. 이름 칸이 52px로 고정되고 값이 그 옆에 왼쪽으로 붙는다.
// UI 시안 기준(paym_001 502:17073 배송지 · 502:17254 주문 수량)이다.
//
// `entities/order`의 `DetailRow`를 쓰지 않는 이유는 모양이 다르기 때문이다. 그쪽은
// 값을 오른쪽 끝에 붙이는 주문 상세(`mypa_161`)·주문 완료(`paym_002`) 구조다.
// 이 화면은 이름 옆에 값이 바로 온다. 같은 모양이 여기서만 두 번 쓰여 공용으로 올리지 않았다.

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type FieldRowProps = {
  term: string;
  description: ReactNode;
  className?: string;
};

export function FieldRow({ term, description, className }: FieldRowProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {/* 시안이 이름 칸을 52px로 고정해 값의 왼쪽 끝을 맞춘다 */}
      <dt className="w-13 shrink-0 text-body-medium-14 text-text-body-secondary">{term}</dt>
      <dd className="min-w-0 text-body-medium-14 text-surface-primary">{description}</dd>
    </div>
  );
}
