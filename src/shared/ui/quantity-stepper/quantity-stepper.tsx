// 수량을 하나씩 올리고 내린다. 가운데 숫자는 읽기만 한다.
// 와이어프레임 기준(cart_001)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { IoAdd, IoRemove } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  /** 무엇의 수량인지. 화면에는 보이지 않고 스크린 리더가 읽는다 */
  label: string;
  min?: number;
  max?: number;
  className?: string;
};

const BUTTON = "flex size-11 items-center justify-center text-foreground disabled:opacity-40";

export function QuantityStepper({
  value,
  onChange,
  label,
  min = 1,
  max = 99,
  className,
}: QuantityStepperProps) {
  return (
    <div
      className={cn("flex items-center rounded-lg border border-border", className)}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label={`${label} 하나 줄이기`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={BUTTON}
      >
        <IoRemove aria-hidden className="size-4" />
      </button>

      {/* 값이 바뀌면 스크린 리더가 알리도록 live 영역으로 둔다 */}
      <span aria-live="polite" className="min-w-8 text-center text-sm text-foreground">
        {value}
      </span>

      <button
        type="button"
        aria-label={`${label} 하나 늘리기`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={BUTTON}
      >
        <IoAdd aria-hidden className="size-4" />
      </button>
    </div>
  );
}
