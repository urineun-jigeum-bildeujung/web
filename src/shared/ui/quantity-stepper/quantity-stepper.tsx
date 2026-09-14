// 수량을 하나씩 올리고 내린다. 가운데 숫자는 읽기만 한다.
// UI 시안(cart_001) 기준이다. 칸 하나가 32×32(`button/m`)이고 좌우 끝만 둥글다.

"use client";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  /** 무엇의 수량인지. 화면에는 보이지 않고 스크린 리더가 읽는다 */
  label: string;
  min?: number;
  max?: number;
  className?: string;
};

// 시안이 칸 세 개를 하나의 테두리로 묶고 사이를 선으로 나눈다.
// 그래서 테두리를 바깥 div가 아니라 각 칸이 나눠 갖는다 — 가운데 칸은 좌우 선이 없다.
const CELL = "flex size-8 items-center justify-center border-y border-border";
const BUTTON = cn(CELL, "text-icon-stroke-secondary disabled:text-icon-stroke-disable");

export function QuantityStepper({
  value,
  onChange,
  label,
  min = 1,
  max = 99,
  className,
}: QuantityStepperProps) {
  return (
    <div className={cn("flex items-center", className)} role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`${label} 하나 줄이기`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={cn(BUTTON, "rounded-l-md border-l")}
      >
        <Icon name="minus" className="size-4" />
      </button>

      {/* 값이 바뀌면 스크린 리더가 알리도록 live 영역으로 둔다 */}
      {/* 시안은 칸 사이를 테두리가 아니라 가운데 12px짜리 짧은 선으로 나눈다.
          칸에 좌우 테두리를 주면 위아래 끝까지 이어져 다른 모양이 된다 */}
      <span
        aria-live="polite"
        className={cn(
          CELL,
          "relative text-label-medium-14 text-foreground",
          "before:absolute before:left-0 before:h-3 before:w-px before:bg-border",
          "after:absolute after:right-0 after:h-3 after:w-px after:bg-border",
        )}
      >
        {value}
      </span>

      <button
        type="button"
        aria-label={`${label} 하나 늘리기`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={cn(BUTTON, "rounded-r-md border-r")}
      >
        <Icon name="plus" className="size-4" />
      </button>
    </div>
  );
}
