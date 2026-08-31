// 폼 한 항목. 레이블과 입력, 그 아래 예시 문구를 묶고 접근성 연결을 대신한다.
// 와이어프레임 기준(onbo_002~004, mypa_111, mypa_311, mypa_312)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { IoCloseCircle } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";
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
} & Omit<ComponentProps<typeof Input>, "id" | "aria-describedby" | "aria-invalid">;

export function FormField({
  label,
  hint,
  error,
  onClear,
  leading,
  className,
  value,
  disabled,
  ...props
}: FormFieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  // 비활성 상태에서는 지우기도 막는다. 안 그러면 못 고치는 값을 지울 수 있다.
  const canClear = Boolean(onClear) && !disabled && value !== undefined && value !== "";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>

      <div className="relative">
        {leading && (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted-foreground"
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
          // 파일을 고치는 대신 호출부에서 덮는다.
          className={cn("min-h-11", leading && "pl-10", canClear && "pr-11")}
          {...props}
        />
        {canClear && (
          <button
            type="button"
            aria-label="입력 지우기"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <IoCloseCircle aria-hidden className="size-5" />
          </button>
        )}
      </div>

      {(error || hint) && (
        <p
          id={descriptionId}
          className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
