// 머리말 왼쪽의 뒤로가기·닫기 버튼. 시안 공용 header(3581:82062)의 touch_guide 값을 그대로 쓴다.
// 머리말을 직접 짜야 하는 화면(검색 입력 머리말, 다이얼로그)도 이것을 써 모든 화면에서 자리·크기가 같다 (#513).

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

const LABEL = {
  back: "이전 화면으로",
  close: "닫기",
} as const;

type HeaderBackButtonProps = {
  /** 뒤로가기 화살표인지 닫기 X인지 */
  icon?: "back" | "close";
} & ComponentProps<"button">;

export function HeaderBackButton({ icon = "back", className, ...props }: HeaderBackButtonProps) {
  return (
    <button
      type="button"
      aria-label={LABEL[icon]}
      // 시안은 누르는 자리 48×48이 왼쪽 여백(20px)에서 시작하고 32px 아이콘(icon/height/xl)이 그 왼쪽에
      // 붙는다. 전처럼 44px 가운데에 24px로 두면 화살표가 작고 7px 오른쪽으로 밀린다(#513).
      // 색은 컴포넌트 기본값 icon/stroke/tertiary다 — 몇 화면이 짙은 색으로 덮어썼지만 한 가지로 맞춘다
      className={cn(
        "flex size-12 shrink-0 items-center justify-start rounded-md text-icon-stroke-tertiary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      {...props}
    >
      {/* 시안의 헤더에는 X가 없어 닫기는 전처럼 24px로 둔다 */}
      <Icon
        name={icon === "close" ? "cancel" : "left"}
        className={icon === "close" ? "size-6" : "size-8"}
      />
    </button>
  );
}
