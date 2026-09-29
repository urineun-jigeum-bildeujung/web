// 아이의 반응을 고르는 붙은 세그먼트. 보기 2~3개가 한 상자 안에 칸으로 나뉘고 고른 칸은 브랜드색으로 찬다.
// UI 시안 기준(리뷰작성 1884-29400의 문항 상자)이다. 높이 44, 모서리 12, 글자 label/medium_12.
//
// 겉모습은 버튼 줄이지만 라디오로 만든다. 배타적 선택이라 스크린 리더가 "3개 중 1번째"로 읽어야 한다.
//
// 고른 칸을 다시 누르면 답하지 않은 상태로 돌아간다(QA RV-007). 라디오는 원래 풀리지 않아,
// 모르는 항목을 잘못 눌렀을 때 아무 답이나 남기게 된다 — 선택 문항에서 그 답이 추천 근거를 흐린다.

"use client";

import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge/badge";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import type { Question } from "../model/questions";

type ResponseSelectProps = {
  question: Question;
  value?: string;
  /** 고른 칸을 다시 눌러 풀면 `undefined`가 온다 */
  onValueChange: (value: string | undefined) => void;
  className?: string;
};

export function ResponseSelect({ question, value, onValueChange, className }: ResponseSelectProps) {
  const id = useId();

  return (
    <section className={cn("flex flex-col gap-2 px-5 pb-4", className)}>
      <h3 className="flex flex-col">
        <span className="text-label-medium-12 text-text-body-secondary">{question.topic}</span>
        <span className="flex items-center gap-1.5 text-label-bold-14 text-foreground">
          <span>
            {question.question}
            {question.hint && (
              <span className="text-body-medium-14 text-text-body-secondary"> {question.hint}</span>
            )}
          </span>
          {/* 시안이 문항마다 배지를 붙인다. 섹션에는 없다 (1884-29158, #302) */}
          <Badge tone={question.required ? "brand" : "default"}>
            {question.required ? "필수" : "선택"}
          </Badge>
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
                // Radix는 고르지 않은 칸을 누를 때만 값을 바꾼다. 고른 칸이면 그 처리를 막고 푼다.
                // 레이블을 눌러도, Space를 눌러도 이 버튼의 click으로 들어온다
                onClick={(event) => {
                  if (!selected) return;
                  event.preventDefault();
                  onValueChange(undefined);
                }}
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
