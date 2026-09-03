// 별을 눌러 점수를 매긴다. 보여주기만 하는 Rating과 달리 값을 받는다.
// 와이어프레임 기준(리뷰 작성_기본 상태)이라 디자인 확정 시 바뀔 수 있다.
//
// 시안은 3.5개로 그려져 있지만 정수로만 받는다. 반쪽을 누르게 하려면 별 하나를
// 좌우로 갈라야 하는데 그러면 탭 영역이 22px로 줄어 최소 44px 기준을 못 맞춘다.

"use client";

import { IoStar, IoStarOutline } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

type RatingInputProps = {
  value: number;
  onChange: (next: number) => void;
  /** 무엇에 매기는 점수인지. 화면에는 보이지 않고 스크린 리더가 읽는다 */
  label: string;
  max?: number;
  className?: string;
};

export function RatingInput({ value, onChange, label, max = 5, className }: RatingInputProps) {
  return (
    // 별 다섯 중 하나를 고르는 것이라 라디오로 만든다. 화살표 키로 옮겨 다닐 수 있다
    <div role="radiogroup" aria-label={label} className={cn("flex justify-center", className)}>
      {Array.from({ length: max }, (_, index) => {
        const score = index + 1;
        const filled = score <= value;
        const Icon = filled ? IoStar : IoStarOutline;

        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={score === value}
            aria-label={`${max}점 만점에 ${score}점`}
            // 고르지 않은 별에도 초점이 가야 화살표 키로 옮겨 다닐 수 있다.
            // 아무것도 고르지 않았으면 첫 별이 Tab을 받는다
            tabIndex={score === value || (value === 0 && score === 1) ? 0 : -1}
            onClick={() => onChange(score)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                onChange(Math.min(max, value + 1));
              }
              if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                onChange(Math.max(1, value - 1));
              }
            }}
            className="flex size-11 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon
              aria-hidden
              className={cn("size-8", filled ? "text-destructive" : "text-destructive/30")}
            />
          </button>
        );
      })}
    </div>
  );
}
