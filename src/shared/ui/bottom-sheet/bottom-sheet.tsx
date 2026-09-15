// 아래에서 올라와 화면 가장자리에서 떨어져 떠 있는 시트. 위에 손잡이가 있고 모서리가 넷 다 둥글다.
// UI 시안 기준(onbo_004_바텀, onbo_003_bcs툴팁)이다.
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
  className?: string;
};

export function BottomSheet({
  open,
  onOpenChange,
  children,
  showHandle = true,
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
            // 양옆 8px·아래 32px 띄운 카드. 넓은 화면에서는 앱 기둥(420px)에서 양옆 8px을 뺀 폭으로 묶는다
            "fixed inset-x-2 bottom-8 z-50 mx-auto flex max-w-101 flex-col rounded-2xl bg-card text-card-foreground outline-none",
            // 내용이 길면 시트 안에서 민다. 위쪽 여백(96px)과 아래 띄운 만큼(32px)을 뺀다
            "max-h-[calc(100dvh-8rem)] overflow-y-auto",
            className,
          )}
        >
          {/* 시안의 손잡이. 40px 영역 가운데 5px 막대 */}
          {showHandle && (
            <div aria-hidden className="flex h-10 shrink-0 items-center justify-center">
              <span className="h-1.25 w-15 rounded-full bg-icon-fill-tertiary" />
            </div>
          )}
          {children}
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
}
