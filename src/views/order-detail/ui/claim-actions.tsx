// 배송이 끝난 주문의 반품·교환 접수. 누르면 무슨 일이 일어나는지 알리고 한 번 더 확인받는다.
// UI 시안 기준(mypa_161_배송완료 302:11585)이다. 구분선 아래 48px 버튼 둘이 나란히 온다.
//
// **배송완료 주문에만 뜬다. 그런데 그 상태로 가는 길이 아직 없다** — 백엔드가 `SHIPPING`·
// `DELIVERED` 전환 스케줄링을 후순위로 미뤘다(2026-09-21 회신). 시연에서는 DB를 직접 고치거나
// 그 상태의 목데이터를 넣어야 이 버튼을 볼 수 있다 (#344).
//
// 접수는 되돌리기 어렵다. 기사가 상품을 가지러 오고 그 뒤에야 환불이나 교환이 진행된다.
// 링크를 누르는 순간 접수되는 것처럼 보이면 안 되므로 확인창으로 한 번 막는다.
//
// **확인하면 신청 화면으로 간다.** 기능명세서의 접수에는 사유와 사진이 따르므로
// 이 확인창에서 바로 서버로 보낼 수 없다 (IA `MYPA_161_P01`·`P02` → `MYPA_261`).

"use client";

import Link from "next/link";
import { useState } from "react";

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
  },
  exchange: {
    trigger: "교환하기",
    title: "교환 접수를 진행할까요?",
    description: "1~2일 안에 기사님이 상품을 수거해요. 상태 확인이 끝나면 새 상품을 보내드릴게요",
    confirm: "교환 접수하기",
  },
} as const;

type ClaimType = keyof typeof CLAIMS;

export function ClaimActions({ orderId }: { orderId: number }) {
  const [opened, setOpened] = useState<ClaimType | null>(null);
  const claim = opened ? CLAIMS[opened] : null;

  return (
    <>
      {/* 시안은 상품 줄 아래에 구분선을 두고 둘을 나란히 놓는다 */}
      <div className="flex gap-2 border-t border-border pt-2">
        {(Object.keys(CLAIMS) as ClaimType[]).map((type) => (
          <Button
            key={type}
            variant="ghost"
            className="h-12 flex-1 text-label-bold-16 text-foreground"
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
            {/* 여기서 서버를 부르지 않는다. 사유와 사진을 받아야 접수가 되므로 신청 화면에 넘긴다 */}
            <AlertDialogAction className="min-h-11" asChild>
              <Link href={`/mypage/orders/${orderId}/claim?type=${opened}`}>{claim?.confirm}</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
