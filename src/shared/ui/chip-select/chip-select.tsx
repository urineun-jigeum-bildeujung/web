// 보기 중 하나만 고르는 칩 묶음. 성별·중성화 여부처럼 답이 배타적인 항목에 쓴다.
// 와이어프레임 기준(onbo_002 성별·중성화, onbo_003 체구)이라 디자인 확정 시 바뀔 수 있다.
//
// 겉모습은 버튼이지만 라디오로 만든다. 배타적 선택이라 스크린 리더가
// "3개 중 1번째"로 읽어야 하고, 화살표 키로 옮겨 다닐 수 있어야 한다.

"use client";

import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

type ChipOption = {
  value: string;
  label: string;
  /** 레이블 아래 작게 붙는 보충 설명. 체구의 "10kg 미만" 같은 것 */
  description?: string;
};

type ChipSelectProps = {
  /** 이 묶음이 무엇을 묻는지. 화면에는 보이지 않고 스크린 리더가 읽는다 */
  label: string;
  options: ChipOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  /** 한 줄에 몇 개를 놓을지. 기본은 보기 수에 맞춰 나눈다 */
  columns?: number;
  className?: string;
};

export function ChipSelect({
  label,
  options,
  value,
  onValueChange,
  columns,
  className,
}: ChipSelectProps) {
  const id = useId();
  const perRow = columns ?? options.length;

  return (
    <RadioGroup
      aria-label={label}
      // undefined를 그대로 넘긴다. 여기서 ""로 바꾸면 value를 주지 않는 쓰임이
      // 늘 controlled가 되어 눌러도 골라지지 않는다
      value={value}
      onValueChange={onValueChange}
      className={cn("grid gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const itemId = `${id}-${option.value}`;
        const selected = value === option.value;

        return (
          <div key={option.value} className="relative">
            {/* 라디오 자체는 숨기고 레이블 전체를 누를 수 있게 한다.
                라디오가 레이블의 형제라 has-[]로는 포커스를 못 잡는다. peer로 잇는다. */}
            <RadioGroupItem id={itemId} value={option.value} className="peer sr-only" />
            <label
              htmlFor={itemId}
              className={cn(
                "flex min-h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border px-3 py-2 text-center transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              <span className="text-sm font-medium">{option.label}</span>
              {option.description && (
                <span
                  className={cn(
                    "text-xs",
                    selected ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {option.description}
                </span>
              )}
            </label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
