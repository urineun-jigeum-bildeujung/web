"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // 시안(상품 상세 리뷰 필터, 1716-34322·1716-34330 switch-mark)은 38×24px
        // 트랙에 18px 흰 원이 4px 인셋으로 들어간다. 투명 테두리(border-transparent,
        // 포커스 시 색만 바뀜)가 1px을 먹어서 padding을 4px 그대로 두면 실제 인셋이
        // 5px이 된다 — 그만큼 3px로 줄여 테두리 1px과 합쳐 정확히 4px을 맞춘다.
        // 안 켠 상태는 surface-disable(#d2d3d9)이고, 켠 상태는 이 프로젝트가
        // "골랐음"에 항상 쓰는 브랜드 오렌지를 그대로 쓴다
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent p-0.75 transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-6 data-[size=default]:w-9.5 data-[size=sm]:h-3.5 data-[size=sm]:w-6 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-brand data-unchecked:bg-surface-disable data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-icon-fill-static-white ring-0 transition-transform group-data-[size=default]/switch:size-4.5 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-3 group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
