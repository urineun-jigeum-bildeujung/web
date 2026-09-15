// 체형(BCS) 다섯 단계 중 하나를 고르는 슬라이더와 눈금 문구.
// UI 시안 기준(onbo_003_체구선택후)이다. 온보딩과 아이 체형 수정이 함께 쓴다.
//
// 트랙이 통째로 진한 색이고 점선 눈금이 다섯 칸을 가르며, 손잡이는 고른 칸의 한가운데에 선다.
// shadcn Slider 파일을 고치는 대신 data-slot 선택자로 호출부에서 모양을 덮는다.

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
      {/* 보이는 트랙과 눈금은 우리가 그리고, Radix 슬라이더는 투명하게 그 위에 얹는다.
          Radix는 값을 자기 폭에 선형으로 놓아 가운데 값만 칸 중앙에 오므로, 슬라이더 폭을
          "첫 칸 중앙 ~ 마지막 칸 중앙"(손잡이 반지름만큼 양쪽 확장)으로 잡아 손잡이가
          늘 칸 한가운데에 오게 한다. */}
      <div className="relative h-8">
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/2 grid h-4 -translate-y-1/2 grid-cols-5 rounded-full bg-primary"
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
            "absolute top-0 left-[calc(10%-1rem)] h-8 w-[calc(80%+2rem)]",
            "[&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-track]]:bg-transparent",
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
