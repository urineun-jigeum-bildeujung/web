// 폼 한 항목. 레이블과 입력, 그 아래 예시 문구를 묶고 접근성 연결을 대신한다.
// UI 시안 기준(onbo_002~004의 input, sign_001 로그인·닉네임)이다.
//
// 입력칸은 두 모양이다. 기본은 테두리 상자(onbo_002, 로그인)이고, `underline`은
// 밑줄 하나(sign_001 닉네임)다. 값이 차면 둘 다 선이 진해진다.

"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type FormFieldProps = {
  /** 무엇을 묻는지. "아이의 이름을 알려주세요" */
  label: ReactNode;
  /** 입력 아래 예시나 보충 설명. "ex) 코코, 보리" */
  hint?: ReactNode;
  /** 검증 실패 문구. 있으면 hint 대신 이것을 읽는다 */
  error?: ReactNode;
  /** 값을 지우는 버튼을 띄운다. 값이 있을 때만 보인다 */
  onClear?: () => void;
  /** 입력칸 왼쪽 안에 놓는 아이콘. 검색창의 돋보기처럼 무엇을 넣는 칸인지 보일 때 쓴다 */
  leading?: ReactNode;
  /** 입력칸 오른쪽 안에 놓는 것. 휴대폰 인증의 "인증" 칩처럼 그 칸에서 바로 하는 동작이다.
   *  지우기 버튼과 같은 자리라 이것이 있으면 지우기는 그리지 않는다 */
  trailing?: ReactNode;
  /** 입력칸 모양. 테두리 상자가 기본이고 `underline`은 밑줄 하나다 */
  variant?: "outline" | "underline";
} & Omit<ComponentProps<typeof Input>, "id" | "aria-describedby" | "aria-invalid">;

export function FormField({
  label,
  hint,
  error,
  onClear,
  leading,
  trailing,
  variant = "outline",
  className,
  value,
  disabled,
  ...props
}: FormFieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const filled = value !== undefined && value !== "";
  // 비활성 상태에서는 지우기도 막는다. 안 그러면 못 고치는 값을 지울 수 있다.
  const canClear = Boolean(onClear) && !disabled && filled && !trailing;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Label htmlFor={id} className="text-title-bold-16">
        {label}
      </Label>

      <div className="relative">
        {leading && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-icon-stroke-tertiary"
          >
            {leading}
          </span>
        )}
        <Input
          id={id}
          value={value}
          disabled={disabled}
          aria-describedby={error || hint ? descriptionId : undefined}
          aria-invalid={error ? true : undefined}
          // shadcn Input의 기본 높이는 32px이라 모바일 터치 기준에 못 미친다.
          // 파일을 고치는 대신 호출부에서 덮는다. 값이 차면 시안대로 선이 진해진다
          className={cn(
            "min-h-11 px-3 text-body-medium-14 placeholder:text-text-body-tertiary",
            // 밑줄형은 상자의 모서리·테두리·포커스 링을 지우고 아래 선만 남긴다
            variant === "underline" &&
              "rounded-none border-0 border-b border-border-default bg-transparent focus-visible:border-ring focus-visible:ring-0 dark:bg-transparent",
            filled && "border-border-secondary",
            leading && "pl-10",
            canClear && "pr-11",
            trailing && "pr-16",
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-3 flex items-center">{trailing}</span>
        )}
        {canClear && (
          <button
            type="button"
            aria-label="입력 지우기"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-icon-stroke-tertiary hover:text-foreground"
          >
            <Icon name="cancel" />
          </button>
        )}
      </div>

      {(error || hint) && (
        <p
          id={descriptionId}
          className={cn(
            "text-caption-regular-12",
            error ? "text-destructive" : "text-text-body-tertiary",
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
