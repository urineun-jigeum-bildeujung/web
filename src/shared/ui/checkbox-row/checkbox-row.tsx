// 체크박스와 설명을 한 줄로 묶는다. "해당 사항이 없어요" 같은 단일 확인에 쓴다.
// UI 시안 기준(onbo_004 두 곳)이다.
//
// 시안의 체크는 24px 원이고 안 골랐을 때도 체크 모양이 회색으로 보인다. shadcn Checkbox는
// 골랐을 때만 표시를 그리므로, 표시는 숨기고 체크 모양을 뒤에 따로 둔다. 골랐는지는
// 원의 색과 aria-checked로 전한다.

"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";
import { Icon } from "@/shared/ui/icon/icon";

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
    <div className={cn("flex min-h-11 items-center gap-1.5", className)}>
      <span className="relative flex size-6 shrink-0 items-center justify-center">
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(next) => onCheckedChange?.(next === true)}
          className="size-6 rounded-full border-0 bg-surface-disable dark:bg-surface-disable data-checked:bg-primary dark:data-checked:bg-primary [&_[data-slot=checkbox-indicator]]:hidden"
        />
        <Icon
          name="check"
          className="pointer-events-none absolute size-4 text-icon-fill-static-white"
        />
      </span>
      {/* 레이블이 남은 폭을 모두 차지해 행 어디를 눌러도 체크된다 */}
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-11 flex-1 cursor-pointer items-center text-caption-regular-13 text-text-body-secondary select-none",
          disabled && "cursor-not-allowed text-text-label-disable",
        )}
      >
        {label}
      </label>
    </div>
  );
}
