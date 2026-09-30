// 추천 상품 카드에 붙는 "왜 우리 아이에게 추천하는지"와, 알레르기 성분이 겹칠 때의 주의 한 줄.
// 시안이 없어 IA 기준으로 만들었다(#600). 별점·인기순 나열과 갈라지는 근거라 카드마다 보인다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

type RecommendationReasonProps = {
  /** AI가 준 추천 이유(`reason_text`) */
  reason: string;
  /** 아이가 등록한 알레르기 성분과 겹쳐 감점된 상품 */
  allergyPenalized?: boolean;
} & ComponentProps<"div">;

/**
 * **겹친 성분 이름은 보이지 않는다.** 응답에는 성분 코드(`CHICKEN` 등)만 오고, 사람이 읽을 이름으로
 * 바꿀 표가 없다. 코드를 그대로 보이면 백엔드 값이 화면에 새어 나온다(app-message-convention).
 * 무엇이 겹쳤는지는 상품 상세의 성분에서 확인한다.
 */
export function RecommendationReason({
  reason,
  allergyPenalized = false,
  className,
  ...props
}: RecommendationReasonProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      <p className="text-label-medium-12 break-keep text-text-body-secondary">
        <span className="sr-only">추천 이유. </span>
        {reason}
      </p>
      {allergyPenalized && (
        // 색만으로 알리지 않도록 아이콘과 문장을 함께 둔다
        <p className="flex items-start gap-1 text-label-medium-12 break-keep text-text-body-danger-default">
          <Icon name="exclaimation_mark" aria-hidden className="size-4 shrink-0" />
          등록한 알레르기 성분이 들어 있어요
        </p>
      )}
    </div>
  );
}
