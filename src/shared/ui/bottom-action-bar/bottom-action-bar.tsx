// 화면 하단에 고정되는 버튼 줄. 버튼 한두 개와 비활성 상태를 다루고 safe-area 여백을 여기서 처리한다.
// 와이어프레임 기준(onbo_001~005, mypa_111, mypa_311)이라 디자인 확정 시 바뀔 수 있다.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type BottomActionBarProps = {
  /** 버튼 하나 또는 둘. 둘이면 왼쪽이 보조, 오른쪽이 주 동작이다 */
  children: ReactNode;
  /** 스크롤 영역 위에 겹쳐 띄울지, 문서 흐름에 둘지 */
  sticky?: boolean;
} & ComponentProps<"div">;

export function BottomActionBar({
  children,
  sticky = true,
  className,
  ...props
}: BottomActionBarProps) {
  return (
    <div
      className={cn(
        // 홈 인디케이터에 버튼이 가리지 않도록 safe-area만큼 아래 여백을 더한다
        "inset-x-0 bottom-0 border-t border-border bg-background px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]",
        // 버튼이 둘이면 나란히, 하나면 가득 채운다
        "flex gap-2 [&>*]:flex-1",
        sticky && "sticky",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
