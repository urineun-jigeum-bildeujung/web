// 손으로 밀어서 넘기는 가로 목록.
// 와이어프레임 기준(메인)이라 디자인 확정 시 바뀔 수 있다.
//
// 캐러셀이 아니다. 저절로 넘어가지 않고 사용자가 미는 만큼만 움직인다 —
// 디자인팀이 그렇게 정했다. 자동 전환은 읽는 도중에 내용이 바뀌어 방해가 된다.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type ScrollRowProps = {
  /** 이 목록이 무엇인지. 화면에는 보이지 않고 스크린 리더가 읽는다 */
  label: string;
  children: ReactNode;
  /** 한 칸 너비. 화면 폭에 대한 비율로 준다 */
  itemWidth?: string;
} & ComponentProps<"ul">;

export function ScrollRow({ label, children, itemWidth, className, ...props }: ScrollRowProps) {
  return (
    <ul
      aria-label={label}
      // 목록 자체에 tabIndex를 주지 않는다. 칸 안이 모두 링크나 버튼이라
      // Tab으로 넘어가면 브라우저가 그 자리로 알아서 스크롤한다.
      className={cn(
        "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      style={itemWidth ? ({ "--row-item": itemWidth } as React.CSSProperties) : undefined}
      {...props}
    >
      {children}
    </ul>
  );
}

/** 가로 목록 한 칸. 화면 폭에 맞춰 다음 칸이 조금 비치게 둔다 */
export function ScrollRowItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={cn("w-[var(--row-item,45%)] shrink-0 snap-start", className)} {...props} />;
}
