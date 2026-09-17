// 아래에서 올라오는 시트. 위에 손잡이가 있다. 모양이 둘이다.
// `floating`(기본): 화면 가장자리에서 떨어져 뜨고 모서리가 넷 다 둥글다.
// UI 시안 기준(onbo_004_바텀, onbo_003_bcs툴팁, mypa_021 반응 시트)이다.
// `full`: 화면 폭을 꽉 채우고 위쪽 모서리만 둥글다. 메인 상태 체크·타임딜 옵션 시안 기준이다.
// 두 형태 모두 같은 화면(메인 상태 체크)이 아니라 시안마다 다르게 그려져 있어 그대로 옮긴다.
//
// shadcn Drawer는 바닥에 붙는 모양이고 덮개 색·손잡이 크기도 시안과 달라, Drawer 파일을
// 고치는 대신(CLI가 덮어쓴다) 여기서 같은 조각으로 시안 모양을 조립한다.

"use client";

import type { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/shared/lib/utils";
import { Drawer, DrawerOverlay, DrawerPortal } from "@/shared/ui/drawer";

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 손잡이 아래에 들어갈 내용. 제목은 `DrawerTitle`로 넣어야 스크린 리더가 시트 이름을 읽는다 */
  children: ReactNode;
  /** 위쪽 손잡이. 시안에 손잡이가 없는 카드에서 끈다 (mypa_061_구매확정). 꺼도 끌어내려 닫는 것은 그대로다 */
  showHandle?: boolean;
  /** `floating`(기본)은 뜨는 카드, `full`은 화면 폭을 꽉 채우는 시트다 */
  variant?: "floating" | "full";
  className?: string;
};

export function BottomSheet({
  open,
  onOpenChange,
  children,
  showHandle = true,
  variant = "floating",
  className,
}: BottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        {/* 시안의 덮개는 흐림 없이 어둡게만 깔린다 */}
        <DrawerOverlay className="bg-surface-overlay-dimmed supports-backdrop-filter:backdrop-blur-none" />
        <DrawerPrimitive.Content
          data-slot="drawer-content"
          className={cn(
            "fixed z-50 mx-auto flex max-w-105 flex-col bg-card text-card-foreground outline-none",
            variant === "floating"
              ? // 양옆 8px·아래 32px 띄운 카드. 넓은 화면에서는 앱 기둥(420px)에서 양옆 8px을 뺀 폭으로 묶는다
                "inset-x-2 bottom-8 max-w-101 rounded-2xl"
              : // 화면 폭 꽉 채움, 위쪽 모서리만 둥글게
                "inset-x-0 bottom-0 rounded-t-xl",
            // 내용이 길면 시트 안에서 민다. 위쪽 여백(96px)과 아래 띄운 만큼을 뺀다
            "max-h-[calc(100dvh-8rem)] overflow-y-auto",
            className,
          )}
        >
          {/* 시안의 손잡이. 40px 영역 가운데 5px 막대 */}
          {showHandle && (
            <div aria-hidden className="flex h-10 shrink-0 items-center justify-center">
              <span className="h-1.25 w-15 rounded-full bg-surface-secondary" />
            </div>
          )}
          {children}
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
}
