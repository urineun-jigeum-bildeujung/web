// 배송 전 주문의 취소. 맨 아래 진한 버튼을 누르면 확인 모달을 한 번 거쳐 주문 전체를 취소한다.
// UI 시안 기준(mypa_161_준비중_주문상세 3324:37275, mypa_161_주문취소_모달 3337:49344)이다 (#410).
//
// **주문 목록에서 옮겨 왔다.** 서버는 주문 전체만 취소하는데(PM 검토까지 끝난 제약, 2026-09-23
// 백엔드 답) 목록은 상품마다 "주문 취소"를 달아, 한 상품에서 눌러도 함께 주문한 상품까지
// 취소됐다. PD팀이 "모달 설명이 있어도 인지하지 못하는 사용자가 있다"며 주문 전체가 보이는
// 상세 맨 아래로 옮겼다(2026-09-23). 모달 문구는 그대로다.

"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useMutateOrder } from "@/entities/order";
import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";

/** 시안 dialog의 action_button. 40px에 굵은 14px, 둘이 같은 폭으로 나눈다 */
const DIALOG_BUTTON = "h-10 flex-1 rounded-lg text-label-bold-14";

export function CancelOrderAction({ orderId }: { orderId: number }) {
  const { cancel, cancelingId } = useMutateOrder();
  const [open, setOpen] = useState(false);
  const canceling = cancelingId !== null;

  return (
    <>
      {/* 시안의 button/xl. 44px에 굵은 16px, 진한 바탕이다 — 배송완료의 반품·교환 버튼과 같은 자리·모양 */}
      <Button className="h-11 w-full rounded-lg text-label-bold-16" onClick={() => setOpen(true)}>
        주문 취소하기
      </Button>

      {/* 주문 취소는 되돌릴 수 없어 확인 창으로 막는다 */}
      <AlertDialog
        open={open}
        // 보내는 중에는 닫히지 않는다. 닫히면 요청만 남아, 끝났을 때 취소됐는지 알 수 없다
        // (#293 리뷰). Escape도 이 길로 온다 — 테스트로 확인해 따로 막지 않는다 (#410)
        onOpenChange={(next) => {
          if (!next && !canceling) {
            setOpen(false);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          {/* 제목과 설명은 4px로 붙는다. 기본 Header는 모바일에서 가운데 정렬이라 쓰지 않는다 */}
          <div className="flex flex-col gap-1">
            <AlertDialogTitle className="text-title-bold-18 text-foreground">
              주문을 취소할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body-medium-14 break-keep text-text-body-secondary">
              결제하신 금액은 안전하게 환불 처리돼요.
            </AlertDialogDescription>
          </div>
          {/* 기본 Footer는 회색 띠를 두르는데 시안은 카드 안에 버튼만 놓는다 */}
          <div className="flex gap-2">
            <AlertDialogCancel variant="secondary" className={DIALOG_BUTTON} disabled={canceling}>
              닫기
            </AlertDialogCancel>
            {/* **`AlertDialogAction`을 쓰지 않는다.** 그쪽은 버튼 모양을 `asChild`로 얹어 클래스를
                겹칠 때 충돌 정리를 거치지 않아, 빨간 바탕을 줘도 기본 진한 바탕이 이긴다. 누르면
                닫히는 기본 동작도 여기서는 막아야 해서(서버가 끝날 때까지 열어 둔다) 쓸 까닭이 없다.
                시안의 button/bg/danger — 되돌릴 수 없는 동작이라 빨간색이다 */}
            <Button
              className={cn(
                DIALOG_BUTTON,
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              disabled={canceling}
              onClick={async () => {
                try {
                  await cancel(orderId);
                  setOpen(false);
                  toast.success("주문을 취소했어요");
                } catch {
                  // 실패 알림은 MutationCache.onError가 맡는다. 모달은 열어 두어 다시 누를 수 있게 한다
                }
              }}
            >
              <LoadingSwap loading={canceling} label="주문을 취소하는 중">
                주문 취소하기
              </LoadingSwap>
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
