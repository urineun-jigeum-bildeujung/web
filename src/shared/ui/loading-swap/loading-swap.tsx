// 눌러서 응답을 기다리는 동안 내용을 스피너로 바꾸되 자리는 그대로 지킨다.
// 버튼 안의 라벨, 페이지네이션 셰브론처럼 **이미 그려진 UI**가 대기를 알려야 하는 자리에 쓴다.
// 화면이 처음 그려질 때의 대기는 이것이 아니라 `skeleton`이다.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

type LoadingSwapProps = {
  /** 참이면 내용을 가리고 그 자리에 스피너를 겹친다 */
  loading: boolean;
  /** 평소에 보이는 것. 버튼 라벨이나 아이콘 */
  children: ReactNode;
  /** 스크린 리더가 읽을 문구. 조회를 기다리는 자리는 `"주문 내역을 불러오는 중"`처럼 바꾼다 */
  label?: string;
  /** 스피너 크기. 기본 16px이고 아이콘 자리처럼 큰 곳은 `size-5`로 키운다 */
  spinnerClassName?: string;
} & Omit<ComponentProps<"span">, "children">;

export function LoadingSwap({
  loading,
  children,
  label = "처리 중",
  spinnerClassName,
  className,
  ...props
}: LoadingSwapProps) {
  return (
    // 둘을 같은 격자 칸에 겹쳐 둔다. 칸 크기는 더 큰 쪽이 정하므로 버튼 폭이 흔들리지 않는다.
    // absolute로 겹치면 부모마다 relative를 챙겨야 하는데 여기서는 그럴 일이 없다.
    <span className={cn("inline-grid place-items-center", className)} {...props}>
      {/* `invisible`은 자리를 차지한 채 화면에서만 지운다. 걷어내면 버튼이 줄었다 늘어난다.
          보조기기 트리에서도 함께 빠져서 대기 중에 옛 라벨이 읽히지 않는다. */}
      <span className={cn("col-start-1 row-start-1", loading && "invisible")}>{children}</span>
      {loading && (
        <Spinner aria-label={label} className={cn("col-start-1 row-start-1", spinnerClassName)} />
      )}
    </span>
  );
}
