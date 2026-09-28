// 배송이 끝난 주문의 구매 확정. 맨 아래 진한 버튼을 누르면 확정할 상품을 보여주는 시트를 한 번 거친다.
// 시트는 UI 시안 기준(mypa_061_구매확정_시트 3324:36993)이고, 버튼 자리와 문구는 PD팀과 정했다 (#462).
//
// **주문 목록에서 옮겨 왔다.** 서버는 주문 전체만 확정하는데(`POST /orders/{orderId}/confirm`)
// 목록은 상품마다 "구매확정 하기"를 달아, 한 상품에서 눌러도 함께 주문한 상품까지 확정됐다.
// 확정은 되돌릴 수 없고 그 주문의 반품·교환도 닫는다. PD팀은 상품별 확정을 바랐지만 서버가
// 주문 단위라, 주문 취소(#410)처럼 주문 전체가 보이는 상세 맨 아래로 옮겼다(2026-09-28 PD 답).
// 반품·교환 버튼과 한 줄에 "구매확정"·"반품·교환" 둘로 선다 — 글자 버튼 셋은 PD팀이 피했다.

"use client";

import { useState } from "react";

import { OrderProductRow, useMutateOrder, type OrderDetailItem } from "@/entities/order";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppSuccess } from "@/shared/lib/app-toast";
import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";

/** 시트의 action_button. 40px에 굵은 14px, 둘이 같은 폭으로 나눈다 (3324:37140) */
const SHEET_BUTTON = "h-10 flex-1 rounded-lg text-label-bold-14";

type ConfirmOrderActionProps = {
  orderId: number;
  /** 확정할 주문의 상품 전부. 확정이 주문 단위라 시트가 모두 보인다 */
  items: OrderDetailItem[];
};

export function ConfirmOrderAction({ orderId, items }: ConfirmOrderActionProps) {
  const { confirm, confirmingId } = useMutateOrder();
  const [open, setOpen] = useState(false);
  const confirming = confirmingId !== null;

  return (
    <>
      {/* 시안의 button/xl. 44px에 굵은 16px, 진한 바탕이다. 옆의 "반품·교환"과 폭을 나누고,
          반품·교환 기간이 지나 혼자 남으면 한 줄을 채운다. 문구는 PD팀이 정한 그대로다 */}
      <Button className="h-11 flex-1 rounded-lg text-label-bold-16" onClick={() => setOpen(true)}>
        구매확정
      </Button>

      {/* 구매 확정은 되돌릴 수 없어 무엇을 확정하는지 보여주는 시트를 한 번 거친다.
          시안(3324:37140)은 손잡이·제목·설명이 8px로 붙고 상품·버튼이 12px씩 떨어진다 */}
      <BottomSheet
        open={open}
        // 보내는 중에는 닫히지 않는다. 닫히면 요청만 남아, 끝났을 때 확정됐는지 알 수 없다 (#293 리뷰)
        onOpenChange={(next) => {
          if (!next && !confirming) {
            setOpen(false);
          }
        }}
        className="gap-2 px-5 pb-4"
      >
        <DrawerHeader className="gap-2 p-0">
          <DrawerTitle className="text-left text-title-bold-18 text-foreground">
            무사히 잘 도착했나요?
          </DrawerTitle>
          <DrawerDescription className="text-left text-body-medium-14 text-text-body-secondary">
            구매 확정을 할 수 있어요!
          </DrawerDescription>
        </DrawerHeader>

        <ul className="mt-1 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.orderItemId}>
              <OrderProductRow
                name={item.productName}
                quantity={item.quantity}
                // 위 "주문 상품" 카드와 같은 값이다. 같은 화면에서 두 금액이 갈리면 안 된다
                amount={item.unitPrice * item.quantity}
                imageUrl={item.thumbnailUrl}
              />
            </li>
          ))}
        </ul>

        <div className="mt-1 flex gap-3">
          <Button
            variant="secondary"
            className={SHEET_BUTTON}
            disabled={confirming}
            onClick={() => setOpen(false)}
          >
            나중에 할게요
          </Button>
          <Button
            className={SHEET_BUTTON}
            // 서버가 끝낸 뒤 닫는다. 먼저 닫으면 실패했을 때 확정된 줄 안다
            disabled={confirming}
            onClick={async () => {
              try {
                await confirm(orderId);
                setOpen(false);
                // 문구는 문구 표에서 찾는다. 호출부가 조립하지 않는다 (app-message-convention, #430)
                toastAppSuccess(APP_MESSAGE_CODE.order.purchaseConfirmed);
              } catch {
                // 실패 알림은 MutationCache.onError가 맡는다. 시트는 열어 두어 다시 누를 수 있게 한다
              }
            }}
          >
            <LoadingSwap loading={confirming} label="구매를 확정하는 중">
              확정하기
            </LoadingSwap>
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
