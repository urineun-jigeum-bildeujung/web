// 손으로 밀어서 넘기는 가로 목록.
// UI 시안 기준(메인 홈화면 1758-68883의 세 가로 목록)이다.
//
// 캐러셀이 아니다. 저절로 넘어가지 않고 사용자가 미는 만큼만 움직인다 —
// 디자인팀이 그렇게 정했다. 자동 전환은 읽는 도중에 내용이 바뀌어 방해가 된다.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

// 화면 가장자리까지 이어지는 스크롤 영역을 만들려고, 부모의 가로 padding만큼
// 음수 마진으로 상쇄했다가 같은 값을 다시 준다. 부모 padding과 반드시 같아야 한다.
// 부모가 좌우 모두 padding을 주면(px-4·px-5) BOTH를, 왼쪽만 주고 오른쪽은 화면
// 끝까지 카드가 삐져나오게 비워뒀으면(pl-4·pl-5) LEFT_ONLY를 쓴다 — 안 그러면
// 상쇄할 오른쪽 padding이 없는 채로 음수 마진만 남아 페이지 자체가 옆으로 넘친다
const EDGE_INSET_CLASS = {
  both: {
    4: "-mx-4 scroll-px-4 px-4",
    5: "-mx-5 scroll-px-5 px-5",
  },
  left: {
    4: "-ml-4 scroll-pl-4 pl-4",
    5: "-ml-5 scroll-pl-5 pl-5",
  },
} as const;

type ScrollRowProps = {
  /** 이 목록이 무엇인지. 화면에는 보이지 않고 스크린 리더가 읽는다 */
  label: string;
  children: ReactNode;
  /** 한 칸 너비. CSS width 값이면 뭐든 된다("208px", "80%") — 시안이 고정 폭을
   * 주면 그 px 그대로, 화면 폭에 맞춰 늘어나야 하면 비율로 준다 */
  itemWidth?: string;
  /** 부모의 가로 padding(px-4 또는 px-5)과 같은 값을 준다. 기본 4 */
  edgeInset?: keyof (typeof EDGE_INSET_CLASS)["both"];
  /** 부모가 오른쪽 padding 없이 pl만 줬으면 false. 기본 true(좌우 대칭) */
  bleedRight?: boolean;
} & ComponentProps<"ul">;

export function ScrollRow({
  label,
  children,
  itemWidth,
  edgeInset = 4,
  bleedRight = true,
  className,
  ...props
}: ScrollRowProps) {
  return (
    <ul
      aria-label={label}
      // 목록 자체에 tabIndex를 주지 않는다. 칸 안이 모두 링크나 버튼이라
      // Tab으로 넘어가면 브라우저가 그 자리로 알아서 스크롤한다.
      className={cn(
        "flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1",
        EDGE_INSET_CLASS[bleedRight ? "both" : "left"][edgeInset],
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
