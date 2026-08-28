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
} & Omit<ComponentProps<typeof Input>, "id" | "aria-describedby" | "aria-invalid">;

export function FormField({
  label,
  hint,
  error,
  onClear,
  className,
  value,
  ...props
}: FormFieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const hasValue = value !== undefined && value !== "";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>

      <div className="relative">
        <Input
          id={id}
          value={value}
          aria-describedby={error || hint ? descriptionId : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(onClear && hasValue && "pr-10")}
          {...props}
        />
        {onClear && hasValue && (
          <button
            type="button"
            aria-label="입력 지우기"
            onClick={onClear}
            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
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
