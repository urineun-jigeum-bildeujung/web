// 체형(BCS)이 무엇인지 알려주는 물음표와 그 설명 시트.
// 와이어프레임 기준(onbo_003_bcs툴팁)이라 디자인 확정 시 바뀔 수 있다.
//
// 툴팁이 아니라 아래에서 올라오는 시트다. 다섯 단계를 이름과 설명으로 나열해야 해서
// 툴팁 폭으로는 좁고, 시안 메모도 "물음표를 클릭하면 액션시트로 설명이 뜬다"고 적고 있다.

"use client";

import { useState } from "react";
import { IoHelpCircleOutline, IoHandLeftOutline } from "react-icons/io5";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";

import { BODY_TYPE_GUIDE, BODY_TYPE_OPTIONS } from "../model/breeds";

export function BodyTypeGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="체형이 무엇인지 보기"
        className="flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <IoHelpCircleOutline aria-hidden className="size-4" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        {/* 다섯 단계를 모두 담아 세로로 길다. 낮은 화면(가로 모바일)에서는
            내용이 위아래로 잘리고 스크롤도 되지 않아 여기서 높이를 제한한다.
            공용 Drawer가 mt-24(96px)를 주므로 그만큼 빼야 위쪽이 잘리지 않는다. */}
        <DrawerContent className="max-h-[calc(100dvh-6rem)] overflow-y-auto">
          <DrawerHeader className="gap-2 px-4 pt-2 pb-0">
            <DrawerTitle className="text-left text-base">bcs란?</DrawerTitle>
            <DrawerDescription className="text-left text-sm">
              반려동물의 갈비뼈와 허리 굴곡을 만져서 눈대중으로 비만도를 평가하는 5단계 체형
              지수입니다.
            </DrawerDescription>
          </DrawerHeader>

          <dl className="flex flex-col gap-3 px-4 pt-3 pb-6">
            {BODY_TYPE_OPTIONS.map((label) => (
              <div key={label} className="flex items-start gap-3">
                {/* 만져서 판단한다는 것을 그림으로도 알린다 */}
                <IoHandLeftOutline
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <div className="flex flex-col gap-0.5">
                  <dt className="text-sm font-medium text-foreground">{label}</dt>
                  <dd className="text-xs text-muted-foreground">{BODY_TYPE_GUIDE[label]}</dd>
                </div>
              </div>
            ))}
          </dl>
        </DrawerContent>
      </Drawer>
    </>
  );
}
