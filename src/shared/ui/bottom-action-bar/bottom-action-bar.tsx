// 화면 하단에 고정되는 버튼 줄. 버튼 한두 개와 비활성 상태를 다루고 safe-area 여백을 여기서 처리한다.
// UI 시안 기준(onbo_001~005의 wrapper_button)이다.

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
        "inset-x-0 bottom-0 bg-background px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]",
        // 버튼이 둘이면 나란히, 하나면 가득 채운다
        "flex gap-2 [&>*]:flex-1",
        // 시안의 button/xl. 44px에 굵은 16px이고, 비활성은 흐려지지 않고 회색으로 채워진다.
        // shadcn Button 파일을 고치는 대신 이 줄에 놓이는 버튼만 여기서 덮는다
        "[&>*]:h-11 [&>*]:rounded-lg [&>*]:text-label-bold-16",
        "[&>*:disabled]:bg-surface-disable [&>*:disabled]:text-text-label-disable [&>*:disabled]:opacity-100",
        sticky && "sticky",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
