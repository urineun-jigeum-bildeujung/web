// 체형(BCS) 다섯 단계 중 하나를 고르는 슬라이더와 눈금 문구.
// UI 시안 기준(onbo_003_체구선택후)이다. 온보딩과 아이 체형 수정이 함께 쓴다.
//
// 트랙이 통째로 진한 색이고 점선 눈금이 다섯 칸을 가른다. shadcn Slider 파일을 고치는
// 대신 data-slot 선택자로 호출부에서 모양을 덮는다.

"use client";

import { cn } from "@/shared/lib/utils";
import { Slider } from "@/shared/ui/slider";

import { BODY_TYPE_OPTIONS } from "../model/breeds";

type BodyTypeSliderProps = {
  /** 0부터 센 단계. `BODY_TYPE_OPTIONS`의 인덱스다 */
  value: number;
  onValueChange: (next: number) => void;
  className?: string;
};

export function BodyTypeSlider({ value, onValueChange, className }: BodyTypeSliderProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative">
        {/* 눈금은 손잡이 아래 깔려야 하므로 슬라이더보다 먼저 그린다 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 grid h-4 -translate-y-1/2 grid-cols-5"
        >
          {BODY_TYPE_OPTIONS.slice(0, -1).map((label) => (
            <span key={label} className="border-r border-dashed border-border" />
          ))}
        </div>
        <Slider
          aria-label="체형"
          min={0}
          max={BODY_TYPE_OPTIONS.length - 1}
          step={1}
          value={[value]}
          onValueChange={([next]) => onValueChange(next)}
          className={cn(
            "[&_[data-slot=slider-range]]:bg-primary",
            "[&_[data-slot=slider-track]]:h-4 [&_[data-slot=slider-track]]:bg-primary",
            "[&_[data-slot=slider-thumb]]:size-8 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-surface-tertiary",
            // 손잡이 가운데 흰 점
            "[&_[data-slot=slider-thumb]]:before:absolute [&_[data-slot=slider-thumb]]:before:inset-0 [&_[data-slot=slider-thumb]]:before:m-auto [&_[data-slot=slider-thumb]]:before:size-3.5 [&_[data-slot=slider-thumb]]:before:rounded-full [&_[data-slot=slider-thumb]]:before:bg-icon-fill-static-white",
          )}
        />
      </div>
      {/* 손잡이 위치만으로는 어떤 값인지 알 수 없어 눈금 문구를 함께 둔다 */}
      <div
        aria-hidden
        className="grid grid-cols-5 text-center text-body-medium-14 text-text-body-secondary"
      >
        {BODY_TYPE_OPTIONS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
