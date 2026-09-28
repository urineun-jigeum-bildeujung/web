// 배송이 끝난 주문의 반품·교환 접수. "반품·교환"을 누르면 시트에서 반품과 교환 중 하나를 골라
// 그 신청 화면으로 간다. UI 시안 기준(mypa_161 배송완료 3610:59567, 반품·교환 시트 3610:59865)이다 (#462).
//
// **버튼 하나에 시트를 둔다.** 구매 확정이 상세 맨 아래로 오면서 버튼이 "구매확정"·"반품 신청하기"·
// "교환 신청하기" 셋이 되자, PD팀이 글자 버튼 셋은 권하지 않는다며 "구매확정"·"반품·교환" 둘로 줄이고
// 반품과 교환은 시트에서 고르게 했다(2026-09-28). **예전의 반품·교환 접수 확인 모달은 PD팀이 시안에서
// 지웠다** — 시트에서 한 번 고르는 것이 그 자리를 대신한다. 고른다고 접수되지는 않는다. 사유와 사진을
// 받아야 접수가 되므로 신청 화면에서 세 단계를 거친다 (IA `MYPA_161` → `MYPA_261`).
//
// **배송완료 주문에만 뜬다. 그런데 그 상태로 가는 길이 아직 없다** — 백엔드가 `SHIPPING`·
// `DELIVERED` 전환 스케줄링을 후순위로 미뤘다(2026-09-21 회신). 시연에서는 DB를 직접 고치거나
// 그 상태의 목데이터를 넣어야 이 버튼을 볼 수 있다 (#344).

"use client";

import { useState } from "react";

import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { Icon } from "@/shared/ui/icon/icon";
import { ListRowLink } from "@/shared/ui/list-row/list-row";

export function ClaimActions({ orderId }: { orderId: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 시안의 button/xl. 44px에 굵은 16px, 진한 바탕이다. 옆의 "구매확정"과 폭을 나눈다 */}
      <Button className="h-11 flex-1 rounded-lg text-label-bold-16" onClick={() => setOpen(true)}>
        반품·교환
      </Button>

      <BottomSheet open={open} onOpenChange={setOpen} className="px-5 pb-4">
        {/* 손잡이(40)와 제목 사이 8, 제목과 줄 사이 12 */}
        <DrawerHeader className="p-0 pt-2">
          <DrawerTitle className="text-left text-title-bold-18 text-foreground">
            상품에 문제가 생겼나요?
          </DrawerTitle>
        </DrawerHeader>

        {/* 시안의 줄(44 · 아이콘 28 · 글자 title/bold_16 · 화살표 28)이 공용 ListRow md와 같다.
            줄 안쪽 여백(12)을 시트 여백 밖으로 빼야 글자가 시안처럼 시트 끝에서 24px에 선다 */}
        <ul className="-mx-2 mt-3 flex flex-col gap-3">
          <li>
            <ListRowLink
              href={`/mypage/orders/${orderId}/claim?type=return`}
              title="반품하기"
              icon={<Icon name="refund" className="text-icon-fill-light-red" />}
            />
          </li>
          <li>
            <ListRowLink
              href={`/mypage/orders/${orderId}/claim?type=exchange`}
              title="교환하기"
              icon={<Icon name="change" className="text-icon-fill-light-brand" />}
            />
          </li>
        </ul>
      </BottomSheet>
    </>
  );
}
