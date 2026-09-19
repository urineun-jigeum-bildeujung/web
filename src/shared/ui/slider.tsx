"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  active,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  /** 값을 골랐는지(시안의 "안 고름" 기본 상태와 다른지). 골랐을 때만 채운 구간이
      브랜드 색으로 보인다 — 안 고른 채로 색을 켜면 항상 칠해진 것처럼 보인다 */
  active?: boolean
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        // radix Thumb은 absolute라 Root 높이 계산에 끼지 않는다. 트랙(6px)만 두면
        // 26px 손잡이가 Root 박스 밖(위아래로 10px씩)까지 튀어나와 바로 아래 눈금과
        // 겹친다. 손잡이 높이만큼 Root에 h를 직접 줘 겹치지 않게 자리를 확보한다
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-horizontal:h-6.5 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        className
      )}
      {...props}
    >
      {/* 시안(상품 상세 리뷰 필터, 1716:46878)은 값 앞뒤 구간을 다른 색으로 채우지
          않고 트랙 전체가 한 색이다. Range도 트랙과 같은 색을 줘 채워진 것처럼
          보이지 않게 한다 */}
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-surface-tertiary data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute select-none data-horizontal:h-full data-vertical:w-full",
            active ? "bg-surface-brand" : "bg-surface-tertiary",
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          // 손잡이는 트랙과 같은 회색 26px 원 위에 흰 16px 점을 얹은 모양(시안 자산
          // 그대로 확인). 보이는 크기는 그대로 두고 누르는 자리만 44px로 넓힌다
          className="relative flex size-6.5 shrink-0 items-center justify-center rounded-full bg-surface-tertiary outline-none transition-shadow select-none after:absolute after:-inset-2.25 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <span aria-hidden className="size-4 rounded-full bg-white" />
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
