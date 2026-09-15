// 체형(BCS)이 무엇인지 알려주는 물음표와 그 설명 시트.
// UI 시안 기준(onbo_003_bcs툴팁)이다.
//
// 툴팁이 아니라 아래에서 올라오는 시트다. 다섯 단계를 이름·그림·설명으로 나열해야 해서
// 툴팁 폭으로는 좁고, 시안도 시트로 그려져 있다.

"use client";

import { useState } from "react";
import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { Icon } from "@/shared/ui/icon/icon";

import { BODY_TYPE_GUIDE, BODY_TYPE_OPTIONS } from "../model/breeds";
import { BodyTypeIcon } from "./body-type-icon";

export function BodyTypeGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="체형이 무엇인지 보기"
        // 시안의 아이콘은 24px이지만 탭 영역은 44px을 확보한다
        className="relative flex size-6 items-center justify-center rounded-full text-icon-fill-secondary transition-colors after:absolute after:-inset-2.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Icon name="question" />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <DrawerHeader className="gap-1 px-5 py-0">
          <DrawerTitle className="text-left text-title-bold-18">bcs란?</DrawerTitle>
          <DrawerDescription className="text-left text-body-medium-14 text-text-body-secondary">
            반려동물의 갈비뼈와 허리 굴곡을 만져서 눈대중으로 비만도를 평가하는 5단계 체형
            지수입니다.
          </DrawerDescription>
        </DrawerHeader>

        <dl className="flex flex-col gap-3 px-5 pt-3 pb-4">
          {BODY_TYPE_OPTIONS.map((label) => (
            <div key={label} className="flex items-start gap-2">
              {/* 어떤 몸매인지 그림으로도 알린다 */}
              <BodyTypeIcon type={label} className="size-11.5 shrink-0 text-icon-fill-secondary" />
              <div className="flex flex-col gap-1.5 py-0.5">
                <dt className="text-label-bold-14 text-foreground">{label}</dt>
                <dd className="text-caption-regular-13 font-medium text-text-body-secondary">
                  {BODY_TYPE_GUIDE[label]}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </BottomSheet>
    </>
  );
}
