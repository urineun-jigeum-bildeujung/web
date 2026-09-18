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
    // 크기를 정하는 것은 **자식 하나뿐**이다. 스피너는 흐름에서 빼 겹쳐 놓는다.
    // 둘을 같은 격자 칸에 겹치면 칸이 더 큰 쪽을 따라가서, 자식이 스피너보다 작을 때
    // (`size-3` 아이콘 등) 대기하는 동안 자리가 벌어진다 — 실측 12px → 16px (#233 리뷰).
    <span className={cn("relative inline-flex items-center justify-center", className)} {...props}>
      {/* `invisible`은 자리를 차지한 채 화면에서만 지운다. 걷어내면 버튼이 줄었다 늘어난다.
          보조기기 트리에서도 함께 빠져서 대기 중에 옛 라벨이 읽히지 않는다. */}
      <span className={cn(loading && "invisible")}>{children}</span>
      {loading && (
        <Spinner aria-label={label} className={cn("absolute inset-0 m-auto", spinnerClassName)} />
      )}
    </span>
  );
}
