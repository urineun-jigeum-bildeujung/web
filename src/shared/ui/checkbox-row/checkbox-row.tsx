// 체크박스와 레이블 한 줄. "해당 사항이 없어요" 같은 단일 확인부터 약관 동의 줄까지 쓴다.
// UI 시안 기준(디자인 시스템 Checkbox 컴포넌트. onbo_004 두 곳·sign_001 로그인·약관 동의는
// 원형, 메인 상태 체크 시트(1758-69187)는 둥근 사각형)이다.
//
// 안 골랐을 때도 체크 모양이 회색으로 보인다. shadcn Checkbox는 골랐을 때만 표시를
// 그리므로, 표시는 숨기고 체크 모양을 뒤에 따로 둔다. 골랐는지는 배경색과
// aria-checked로 전한다. 보이는 크기는 시안대로 두고 누르는 자리만 44px로 넓힌다.

"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useId, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";
import { Icon } from "@/shared/ui/icon/icon";

const checkVariants = cva(
  "border-0 bg-surface-disable dark:bg-surface-disable [&_[data-slot=checkbox-indicator]]:hidden",
  {
    variants: {
      size: {
        // 시안 Checkbox의 size m(24)·s(16). 누르는 자리는 둘 다 44px이다
        m: "size-6 after:absolute after:-inset-2.5",
        s: "size-4 after:absolute after:-inset-3.5",
      },
      tone: {
        primary: "data-checked:bg-primary dark:data-checked:bg-primary",
        brand: "data-checked:bg-surface-brand dark:data-checked:bg-surface-brand",
      },
      // 시안 Checkbox의 round prop. true(기본)는 원형, false는 둥근 사각형(4px)이다
      round: {
        true: "rounded-full",
        false: "rounded-[4px]",
      },
    },
    defaultVariants: {
      size: "m",
      tone: "primary",
      round: true,
    },
  },
);

type CheckboxRowProps = VariantProps<typeof checkVariants> & {
  label: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** 레이블 아래 붙는 설명. 이 영역을 눌러도 체크가 바뀌지 않는다 */
  description?: ReactNode;
  /** 줄 오른쪽 끝. 약관 본문으로 가는 화살표처럼 체크와 다른 일을 하는 것을 둔다 */
  trailing?: ReactNode;
  className?: string;
  /** 레이블 글꼴·색을 바꿀 때. 기본은 caption/regular_13에 보조 글자색이다 */
  labelClassName?: string;
};

export function CheckboxRow({
  label,
  checked,
  onCheckedChange,
  disabled,
  size,
  tone,
  round,
  description,
  trailing,
  className,
  labelClassName,
}: CheckboxRowProps) {
  const id = useId();
  const small = size === "s";

  return (
    // 최소 44px을 확보해 손가락으로 누르기 쉽게 한다. 설명이 붙으면 위로 맞춘다
    <div
      className={cn(
        "flex min-h-11 gap-1.5",
        description ? "items-start" : "items-center",
        className,
      )}
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          small ? "size-4" : "size-6",
          // 설명이 있으면 원이 첫 줄 글자(행간 22px) 가운데에 오도록 맞춘다
          description && (small ? "mt-0.75" : "-mt-0.25"),
        )}
      >
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(next) => onCheckedChange?.(next === true)}
          className={checkVariants({ size, tone, round })}
        />
        {/* 체크 아이콘은 원의 2/3 크기다 */}
        <Icon
          name="check"
          className={cn(
            "pointer-events-none absolute text-icon-fill-static-white",
            small ? "size-2.5" : "size-4",
          )}
        />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1 self-stretch">
        {/* 레이블이 남은 자리를 모두 차지해 행 어디를 눌러도 체크된다.
            아래 설명은 htmlFor 밖이라 눌러도 토글되지 않는다 */}
        <label
          htmlFor={id}
          className={cn(
            "flex flex-1 cursor-pointer items-center text-caption-regular-13 text-text-body-secondary select-none",
            disabled && "cursor-not-allowed text-text-label-disable",
            labelClassName,
          )}
        >
          {label}
        </label>
        {description && (
          <p className="text-caption-regular-12 text-text-body-tertiary">{description}</p>
        )}
      </div>

      {trailing}
    </div>
  );
}
