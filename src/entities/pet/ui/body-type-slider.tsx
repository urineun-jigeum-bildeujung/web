// 체형(BCS) 다섯 단계를 고르는 슬라이더. 손잡이를 끌거나 눌러 값을 옮긴다.
// UI 시안 기준(onbo_003_체구선택후, section_bcs)이다.
//
// 트랙이 통째로 진한 색이고 점선 눈금이 다섯 칸을 가르며, 손잡이는 고른 칸의 한가운데에 선다.
// 공용 Slider는 손잡이에 aria-valuetext를 넣을 길이 없어 Radix 조각을 직접 조립한다.
// 눈금 문구는 aria-hidden이라 스크린 리더에는 손잡이 값이 "보통"처럼 읽혀야 한다.

"use client";

import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "@/shared/lib/utils";

import { BODY_TYPE_OPTIONS } from "../model/breeds";

type BodyTypeSliderProps = {
  /** BODY_TYPE_OPTIONS의 인덱스 */
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
        <SliderPrimitive.Root
          min={0}
          max={BODY_TYPE_OPTIONS.length - 1}
          step={1}
          value={[value]}
          onValueChange={([next]) => onValueChange(next)}
          className="absolute top-0 left-[calc(10%-1rem)] flex h-8 w-[calc(80%+2rem)] touch-none items-center select-none"
        >
          <SliderPrimitive.Track className="relative h-4 grow" />
          <SliderPrimitive.Thumb
            aria-label="체형"
            aria-valuetext={BODY_TYPE_OPTIONS[value]}
            className={cn(
              "relative block size-8 shrink-0 rounded-full bg-surface-tertiary ring-ring/50 transition-[color,box-shadow] select-none",
              "hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3",
              // 손잡이 가운데 흰 점
              "before:absolute before:inset-0 before:m-auto before:size-3.5 before:rounded-full before:bg-icon-fill-static-white",
            )}
          />
        </SliderPrimitive.Root>
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
