// 별을 눌러 점수를 매긴다. 보여주기만 하는 Rating과 달리 값을 받고, 반 개 단위다.
// UI 시안 기준(리뷰작성 1884-29400의 별 44px 다섯, 4.5점 표시)이다.
//
// 별 하나를 좌우 22px로 갈라 왼쪽이 반 개, 오른쪽이 한 개다. 시안 값(44px)을 그대로 쓴다.
// 반쪽마다 라디오 하나가 되고 화살표 키는 0.5씩 움직인다.
// 누른 채 밀면 손가락이 지나는 반쪽으로 값이 따라간다. 세로로 밀면 페이지가 스크롤되고 값은 그대로다.
//
// `min`보다 낮은 반쪽은 두지 않는다. 리뷰는 1점부터라(QA RV-020) 첫 별은 가르지 않고 한 칸이 1점이다.
// 0.5점 칸을 남겨 두고 1점으로 올려 주면 "0.5점"이라 읽힌 칸이 한 번도 선택되지 않는다.

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
  /** 매길 수 있는 가장 낮은 점수. 0.5 단위다 */
  min?: number;
  className?: string;
};

export function RatingInput({
  value,
  onChange,
  label,
  max = 5,
  min = 0.5,
  className,
}: RatingInputProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const steps = max * 2;
  const minSteps = min * 2;

  // 끌고 있는 포인터. 별 묶음 자리는 누를 때 한 번만 잰다. 스크롤로 넘어가면 처음 값으로 돌린다
  const drag = useRef<{
    pointerId: number;
    left: number;
    width: number;
    from: number;
    last: number;
  } | null>(null);

  /** 값을 바꾸고 그 반쪽으로 초점도 옮긴다. 초점이 뒤처지면 다음 화살표가 엉뚱한 데서 출발한다 */
  const move = (nextHalves: number) => {
    const clamped = Math.min(steps, Math.max(minSteps, nextHalves));
    onChange(clamped / 2);
    buttons.current[clamped - 1]?.focus({ preventScroll: true });
    return clamped;
  };

  const halves = Math.round(value * 2);

  /** 포인터가 놓인 반쪽으로 값을 옮긴다. 별 묶음 폭을 반쪽 수로 나눠 몇 번째 반쪽인지 센다 */
  const moveToPointer = (clientX: number) => {
    const current = drag.current;
    if (!current || current.width === 0) return;
    const next = Math.min(
      steps,
      Math.max(minSteps, Math.ceil(((clientX - current.left) / current.width) * steps)),
    );
    if (next !== current.last) current.last = move(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        // 누른 뒤 손가락이 별 밖으로 나가도 끝까지 따라가게 포인터를 붙잡는다
        event.currentTarget.setPointerCapture(event.pointerId);
        const { left, width } = event.currentTarget.getBoundingClientRect();
        drag.current = { pointerId: event.pointerId, left, width, from: halves, last: halves };
        moveToPointer(event.clientX);
      }}
      onPointerMove={(event) => {
        if (drag.current?.pointerId === event.pointerId) moveToPointer(event.clientX);
      }}
      // 마지막 이동과 손을 뗀 자리가 다를 수 있어 뗀 자리로 한 번 더 맞춘다
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        moveToPointer(event.clientX);
        drag.current = null;
      }}
      // 세로로 밀어 브라우저가 스크롤로 가져가면 눌렀을 때 바뀐 값을 되돌린다
      onPointerCancel={(event) => {
        const current = drag.current;
        if (current?.pointerId !== event.pointerId) return;
        if (current.last !== current.from) onChange(current.from / 2);
        drag.current = null;
      }}
      className={cn("flex w-fit touch-pan-y justify-center select-none", className)}
    >
      {Array.from({ length: max }, (_, index) => {
        const filled = Math.max(0, Math.min(2, halves - index * 2));

        return (
          <span key={index} className="relative size-11 shrink-0">
            <RatingStar fill={filled === 2 ? 1 : filled === 1 ? 0.5 : 0} className="size-11" />
            {/* 왼쪽 반이 n+0.5점, 오른쪽 반이 n+1점이다 */}
            {[1, 2].map((half) => {
              const step = index * 2 + half;
              if (step < minSteps) return null;
              const score = step / 2;
              const checked = step === halves;
              // 왼쪽 반이 하한 아래라 빠졌으면 오른쪽 칸이 별 전체를 덮는다
              const whole = half === 2 && step - 1 < minSteps;

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
                  // 아무것도 고르지 않았으면 가장 낮은 칸이 Tab을 받는다
                  tabIndex={checked || (halves === 0 && step === minSteps) ? 0 : -1}
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
                    "absolute inset-y-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    whole
                      ? "inset-x-0 rounded-md"
                      : half === 1
                        ? "left-0 w-1/2 rounded-l-md"
                        : "right-0 w-1/2 rounded-r-md",
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
