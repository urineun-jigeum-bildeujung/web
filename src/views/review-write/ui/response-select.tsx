// 아이의 반응을 고르는 붙은 세그먼트. 보기 2~3개가 한 상자 안에 칸으로 나뉘고 고른 칸은 브랜드색으로 찬다.
// UI 시안 기준(리뷰작성 1884-29400의 문항 상자)이다. 높이 44, 모서리 12, 글자 label/medium_12.
//
// 겉모습은 버튼 줄이지만 라디오로 만든다. 배타적 선택이라 스크린 리더가 "3개 중 1번째"로 읽어야 한다.

"use client";

import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import type { Question } from "../model/questions";

type ResponseSelectProps = {
  question: Question;
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export function ResponseSelect({ question, value, onValueChange, className }: ResponseSelectProps) {
  const id = useId();

  return (
    <section className={cn("flex flex-col gap-2 px-5 pb-4", className)}>
      <h3 className="flex flex-col">
        <span className="text-label-medium-12 text-text-body-secondary">{question.topic}</span>
        <span className="text-label-bold-14 text-foreground">
          {question.question}
          {question.hint && (
            <span className="text-body-medium-14 text-text-body-secondary"> {question.hint}</span>
          )}
        </span>
      </h3>
      <RadioGroup
        aria-label={question.question}
        value={value ?? ""}
        onValueChange={onValueChange}
        className="flex gap-0 overflow-hidden rounded-xl border border-border-default"
      >
        {question.options.map((option, index) => {
          const itemId = `${id}-${option.value}`;
          const selected = value === option.value;
          // 칸 사이 선. 마지막 칸과 브랜드색으로 찬 칸의 양옆에는 긋지 않는다
          const divided =
            index < question.options.length - 1 &&
            !selected &&
            value !== question.options[index + 1]?.value;

          return (
            <div key={option.value} className="relative min-w-0 flex-1">
              {/* 라디오는 숨기고 레이블을 누르게 한다. peer로 포커스 표시를 잇는다.
                  shadcn 라디오의 relative·size-4가 sr-only를 덮어 16px가 흐름에 남으므로 다시 덮는다 */}
              <RadioGroupItem
                id={itemId}
                value={option.value}
                className="peer sr-only absolute size-px"
              />
              <label
                htmlFor={itemId}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center px-2.5 text-label-medium-12 transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-inset",
                  divided && "border-r border-border-default",
                  selected
                    ? "bg-surface-brand text-text-body-static-white"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </RadioGroup>
    </section>
  );
}
