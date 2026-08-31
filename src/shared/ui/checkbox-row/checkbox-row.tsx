// 체크박스와 설명을 한 줄로 묶는다. "해당 사항이 없어요" 같은 단일 확인에 쓴다.
// 와이어프레임 기준(onbo_004 두 곳, mypa_311)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";

type CheckboxRowProps = {
  label: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function CheckboxRow({
  label,
  checked,
  onCheckedChange,
  disabled,
  className,
}: CheckboxRowProps) {
  const id = useId();

  return (
    // 최소 44px을 확보해 손가락으로 누르기 쉽게 한다
    <div className={cn("flex min-h-11 items-center gap-2", className)}>
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onCheckedChange?.(next === true)}
      />
      {/* 레이블이 남은 폭을 모두 차지해 행 어디를 눌러도 체크된다 */}
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-11 flex-1 cursor-pointer items-center text-sm text-foreground select-none",
          disabled && "cursor-not-allowed text-muted-foreground",
        )}
      >
        {label}
      </label>
    </div>
  );
}
