// 별을 눌러 점수를 매긴다. 보여주기만 하는 Rating과 달리 값을 받고, 반 개 단위다.
// UI 시안 기준(리뷰작성 1884-29400의 별 44px 다섯, 4.5점 표시)이다.
//
// 별 하나를 좌우 22px로 갈라 왼쪽이 반 개, 오른쪽이 한 개다. 시안 값(44px)을 그대로 쓴다.
// 라디오 열 개가 되고 화살표 키는 0.5씩 움직인다.

"use client";

import { useRef } from "react";

import { cn } from "@/shared/lib/utils";
import { RatingStar } from "@/shared/ui/rating/rating";

type RatingInputProps = {
  value: number;
  onChange: (next: number) => void;
  /** 무엇에 매기는 점수인지. 화면에는 보이지 않고 스크린 리더가 읽는다 */
  label: string;
  max?: number;
  className?: string;
};

export function RatingInput({ value, onChange, label, max = 5, className }: RatingInputProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const steps = max * 2;

  /** 값을 바꾸고 그 반쪽으로 초점도 옮긴다. 초점이 뒤처지면 다음 화살표가 엉뚱한 데서 출발한다 */
  const move = (nextHalves: number) => {
    const clamped = Math.min(steps, Math.max(1, nextHalves));
    onChange(clamped / 2);
    buttons.current[clamped - 1]?.focus();
  };

  const halves = Math.round(value * 2);

  return (
    <div role="radiogroup" aria-label={label} className={cn("flex justify-center", className)}>
      {Array.from({ length: max }, (_, index) => {
        const filled = Math.max(0, Math.min(2, halves - index * 2));

        return (
          <span key={index} className="relative size-11 shrink-0">
            <RatingStar fill={filled === 2 ? 1 : filled === 1 ? 0.5 : 0} className="size-11" />
            {/* 왼쪽 반이 n+0.5점, 오른쪽 반이 n+1점이다 */}
            {[1, 2].map((half) => {
              const step = index * 2 + half;
              const score = step / 2;
              const checked = step === halves;

              return (
                <button
                  key={half}
                  ref={(node) => {
                    buttons.current[step - 1] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={`${max}점 만점에 ${score}점`}
                  // 고르지 않은 반쪽에도 초점이 가야 화살표 키로 옮겨 다닐 수 있다.
                  // 아무것도 고르지 않았으면 첫 반쪽이 Tab을 받는다
                  tabIndex={checked || (halves === 0 && step === 1) ? 0 : -1}
                  onClick={() => onChange(score)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                      event.preventDefault();
                      move(halves + 1);
                    }
                    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                      event.preventDefault();
                      move(halves - 1);
                    }
                  }}
                  className={cn(
                    "absolute inset-y-0 w-1/2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    half === 1 ? "left-0 rounded-l-md" : "right-0 rounded-r-md",
                  )}
                />
              );
            })}
          </span>
        );
      })}
    </div>
  );
}
