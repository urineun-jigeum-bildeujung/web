// 주문 상세의 이름·값 한 줄. 값을 오른쪽 끝에 붙이거나, 길면 이름 아래로 내린다.
// UI 시안 기준(mypa_161 1238:10031 주문번호 · 1238:10084 배송지 항목)이다.
//
// 글자 크기·굵기를 이 조각이 정하지 않는 이유는 시안이 자리마다 다르게 쓰기 때문이다 —
// 주문번호는 `label/bold_14`와 `body/regular_14`, 결제금액은 `title/bold_16`과 `title/bold_18`,
// 배송비는 양쪽 다 `body/medium_14`다. 다섯 벌을 prop으로 받느니 호출부가 직접 건다.
// `shared/ui`의 `DefinitionRow`를 쓰지 않는 이유도 같다. 그쪽은 이름 칸이 고정폭(w-24)이다.

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type DetailRowProps = {
  term: ReactNode;
  description: ReactNode;
  /** 값을 이름 아래로 내린다. 주소나 요청사항처럼 한 줄에 담기 어려운 값 */
  stacked?: boolean;
  className?: string;
};

export function DetailRow({ term, description, stacked, className }: DetailRowProps) {
  return (
    <div
      className={cn(
        stacked ? "flex flex-col gap-2" : "flex items-center justify-between gap-2",
        className,
      )}
    >
      <dt className="shrink-0">{term}</dt>
      <dd className={cn("min-w-0", !stacked && "text-right")}>{description}</dd>
    </div>
  );
}
