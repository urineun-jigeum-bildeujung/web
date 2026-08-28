// 여러 단계로 나뉜 입력 화면의 진행 정도를 상단에 칸으로 보여준다.
// 와이어프레임 기준(onbo_002~onbo_004)이라 디자인 확정 시 바뀔 수 있다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

type StepProgressProps = {
  /** 전체 단계 수 */
  total: number;
  /** 지금 몇 번째인지. 1부터 센다 */
  current: number;
} & ComponentProps<"div">;

export function StepProgress({ total, current, className, ...props }: StepProgressProps) {
  return (
    <div
      // 스크린 리더에는 칸 대신 진행률로 읽힌다
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`전체 ${total}단계 중 ${current}단계`}
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            index < current ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}
