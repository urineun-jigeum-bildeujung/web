// 상품 설명 이미지를 일부만 보여주다 눌러서 펼치는 영역.
// 시안(접힘 1681-13424 · 펼침 1681-14329) 기준. 완전히 숨기는 아코디언과 달리
// 처음에는 402px만 보이고, 더보기를 누르면 설명 전체를 보여준다.
//
// 판매자가 올리는 실제 설명 이미지는 아직 없어(#123) 자리만 잡아 둔다. 자리표시자와
// 아래쪽 그라데이션은 라이트·다크 모드를 따르고, 실제 이미지가 붙으면 다시 확인한다.

"use client";

import { useId, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

export function DescriptionCollapse() {
  const [expanded, setExpanded] = useState(false);
  const descriptionId = useId();

  return (
    // 펼쳤을 때 버튼이 이 상자 밖(절대 위치)으로 튀어나가므로, 그만큼 아래
    // 여백을 미리 잡아 두지 않으면 다음에 오는 내용과 겹친다
    <div className={cn("relative", expanded && "pb-12")}>
      <div
        id={descriptionId}
        className={cn(
          "overflow-hidden rounded-lg bg-surface-secondary",
          expanded ? "max-h-none" : "max-h-100.5",
        )}
      >
        {/* 시안의 이미지 세 장은 353px 너비에서 총 5609px 높이다. API가 붙으면 이 자리만
            실제 이미지로 교체하고, 펼침 높이는 콘텐츠 자체가 결정하도록 둔다. */}
        <div className="relative aspect-[353/5609] w-full">
          <span className="absolute inset-x-0 top-40 text-center text-body-regular-14 text-text-body-tertiary">
            상품 설명 영역
          </span>
        </div>
      </div>

      {!expanded && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-75.25 h-25.25 rounded-b-lg bg-gradient-to-b from-transparent to-surface-default"
        />
      )}

      <button
        type="button"
        aria-controls={descriptionId}
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "absolute left-1/2 z-10 flex h-10 -translate-x-1/2 items-center gap-1.5 rounded-lg px-2 text-label-bold-14 whitespace-nowrap text-text-label-default focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          // 접혔을 때는 시안 위치(그라데이션 위)에, 펼쳤을 때는 늘어난 이미지
          // 바로 아래로 — 클릭한 자리에 그대로 있으면 펼친 내용을 보려고 한참
          // 내려도 "접기"를 다시 누르려면 처음 자리까지 올라가야 한다
          expanded ? "bottom-0" : "top-89.5",
        )}
      >
        상품설명 {expanded ? "접기" : "더보기"}
        <Icon name="down" className={cn("size-6 transition-transform", expanded && "rotate-180")} />
      </button>
    </div>
  );
}
