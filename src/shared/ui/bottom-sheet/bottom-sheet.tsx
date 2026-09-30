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
  /**
   * 거짓이면 끌어내리기·바깥 누르기·Esc로 닫히지 않는다. 보내는 동안 닫기를 거절해야 할 때 준다 —
   * `onOpenChange`에서 거절만 하면 vaul이 끌어내린 위치를 되돌리지 않아 시트가 반쯤 내려간 채
   * 멈춘다(#474)
   */
  dismissible?: boolean;
  /** 손잡이 아래 내용을 담는 스크롤 상자에 붙는다. 여백·간격을 여기서 준다. 손잡이와의 간격은 `pt-*`로 준다 */
  className?: string;
};

export function BottomSheet({
  open,
  onOpenChange,
  children,
  showHandle = true,
  variant = "floating",
  dismissible = true,
  className,
}: BottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible={dismissible}>
      <DrawerPortal>
        {/* 시안의 덮개는 흐림 없이 어둡게만 깔린다 */}
        <DrawerOverlay className="bg-surface-overlay-dimmed supports-backdrop-filter:backdrop-blur-none" />
        <DrawerPrimitive.Content
          data-slot="drawer-content"
          className={cn(
            "fixed z-50 mx-auto flex max-w-105 flex-col bg-card text-card-foreground outline-none",
            variant === "floating"
              ? // 양옆 8px·아래 32px 띄운 카드. 넓은 화면에서는 앱 기둥(420px)에서 양옆 8px을 뺀 폭으로 묶는다.
                // vaul이 끌어올릴 때 아래 틈을 메우려고 붙이는 꼬리(::after, 아래로 시트 높이의
                // 200%)는 끈다. 카드 아래 32px은 비어 있어야 하는 자리다
                "inset-x-2 bottom-8 max-w-101 rounded-2xl after:hidden"
              : // 화면 폭 꽉 채움, 위쪽 모서리만 둥글게. 시안(선택 화면 1758-69187·완료 화면
                // 1758-69255)은 라이트에서 bg/default·surface/default를 쓰지만, 다크 모드
                // 전용 프레임(1758-67357·1758-67425)은 둘 다 surface/default_react를
                // 쓴다 — bg-card가 라이트·다크 양쪽 값을 그대로 만족한다.
                // 화면 아래에 붙어 있어 vaul의 꼬리는 남긴다. 끌어올리면 드러나는 아래 틈을 메운다
                "inset-x-0 bottom-0 rounded-t-xl",
            // 시트 높이의 상한. 위쪽 여백(96px)과 아래 띄운 만큼을 뺀다. 스크롤은 아래 안쪽 상자가 맡는다
            "max-h-[calc(100dvh-8rem)]",
          )}
        >
          {/* 시안의 손잡이. 40px 영역 가운데 5px 막대. 스크롤 상자 밖에 두어 내용을 밀어도 위에 남는다 */}
          {showHandle && (
            <div aria-hidden className="flex h-10 shrink-0 items-center justify-center">
              <span className="h-1.25 w-15 rounded-full bg-surface-secondary" />
            </div>
          )}
          {/* 내용이 길면 이 안에서 민다. 시트 본체가 아니라 이 상자가 스크롤을 맡는다 — 본체가 스크롤
              영역이면 vaul의 꼬리가 그 안에 들어가, 내용이 다 보이는데도 시트 높이의 두 배만큼 빈 자리가
              스크롤됐다(#561). 부르는 쪽 className(여백·간격)도 여기 붙어 스크롤 영역 안쪽을 띄운다.
              모서리는 본체를 따라 깎아 스크롤 막대가 둥근 모서리 밖으로 나오지 않게 한다 */}
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[inherit]",
              className,
            )}
          >
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
}
