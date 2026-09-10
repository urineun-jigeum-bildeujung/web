// 배송이 끝난 주문의 반품·교환 접수. 누르면 무슨 일이 일어나는지 알리고 한 번 더 확인받는다.
// 와이어프레임 기준(mypa_161_배송완료, mypa_161_반품, mypa_161_교환)이라 디자인 확정 시 바뀔 수 있다.
//
// 접수는 되돌리기 어렵다. 기사가 상품을 가지러 오고 그 뒤에야 환불이나 교환이 진행된다.
// 링크를 누르는 순간 접수되는 것처럼 보이면 안 되므로 확인창으로 한 번 막는다.

"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

/** 수거 뒤에 무엇이 오는지가 둘의 차이다. 반품은 환불, 교환은 새 상품이다 */
const CLAIMS = {
  return: {
    trigger: "반품하기",
    title: "반품 접수를 진행할까요?",
    description: "1~2일 안에 기사님이 상품을 수거해요. 상태 확인이 끝나면 바로 환불해 드릴게요",
    confirm: "반품 접수하기",
    done: "반품 접수가 끝났어요",
  },
  exchange: {
    trigger: "교환하기",
    title: "교환 접수를 진행할까요?",
    description: "1~2일 안에 기사님이 상품을 수거해요. 상태 확인이 끝나면 새 상품을 보내드릴게요",
    confirm: "교환 접수하기",
    done: "교환 접수가 끝났어요",
  },
} as const;

type ClaimType = keyof typeof CLAIMS;

export function ClaimActions() {
  const [opened, setOpened] = useState<ClaimType | null>(null);
  const claim = opened ? CLAIMS[opened] : null;

  return (
    <>
      {/* 시안은 결제 금액 아래에 구분선을 두고 둘을 나란히 놓는다 */}
      <div className="flex gap-2 border-t border-border pt-3">
        {(Object.keys(CLAIMS) as ClaimType[]).map((type) => (
          <Button
            key={type}
            variant="ghost"
            className="min-h-11 flex-1"
            onClick={() => setOpened(type)}
          >
            {CLAIMS[type].trigger}
          </Button>
        ))}
      </div>

      <AlertDialog open={claim !== null} onOpenChange={(open) => !open && setOpened(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{claim?.title}</AlertDialogTitle>
          <AlertDialogDescription>{claim?.description}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">닫기</AlertDialogCancel>
            {/* 접수 API가 아직 없다. 계약이 정해지면 이 자리에서 부른다 */}
            <AlertDialogAction
              className="min-h-11"
              onClick={() => claim && toast.success(claim.done)}
            >
              {claim?.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
