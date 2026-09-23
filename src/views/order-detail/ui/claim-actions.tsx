// 배송이 끝난 주문의 반품·교환 접수. 누르면 무슨 일이 일어나는지 알리고 한 번 더 확인받는다.
// UI 시안 기준(mypa_161_주문상세_배송완료 3324:36683, 반품접수_모달 3324:37482, 교환접수_모달)이다.
// 카드 밖 맨 아래에 44px 진한 버튼 둘이 나란히 온다 (#405).
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
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

/**
 * 수거 뒤에 무엇이 오는지가 둘의 차이다. 반품은 환불, 교환은 새 상품이다.
 *
 * 시안은 트리거와 확인 버튼을 같은 문구("반품 신청하기")로 쓴다.
 */
const CLAIMS = {
  return: {
    label: "반품 신청하기",
    title: "반품 접수를 진행할까요?",
    description: "1~2일 안에 기사님이 상품을 수거해요. 상태 확인이 끝나면 바로 환불해 드릴게요",
  },
  exchange: {
    label: "교환 신청하기",
    title: "교환 접수를 진행할까요?",
    description: "1~2일 안에 기사님이 상품을 수거해요. 상태 확인이 끝나면 새 상품을 보내드릴게요",
  },
} as const;

type ClaimType = keyof typeof CLAIMS;

/** 시안 dialog의 action_button. 40px에 굵은 14px, 둘이 같은 폭으로 나눈다 */
const DIALOG_BUTTON = "h-10 flex-1 rounded-lg text-label-bold-14";

export function ClaimActions({ orderId }: { orderId: number }) {
  const [opened, setOpened] = useState<ClaimType | null>(null);
  const claim = opened ? CLAIMS[opened] : null;

  return (
    <>
      {/* 시안의 button/xl. 44px에 굵은 16px, 진한 바탕이다 */}
      <div className="flex gap-2">
        {(Object.keys(CLAIMS) as ClaimType[]).map((type) => (
          <Button
            key={type}
            className="h-11 flex-1 rounded-lg text-label-bold-16"
            onClick={() => setOpened(type)}
          >
            {CLAIMS[type].label}
          </Button>
        ))}
      </div>

      <AlertDialog open={claim !== null} onOpenChange={(open) => !open && setOpened(null)}>
        {/* 시안 dialog(3324:37482) — 흰 카드, 모서리 16, 안쪽 16. 폭(281px)은 앱의 다른
            확인창과 같은 기본값(320px)에 둔다 */}
        <AlertDialogContent className="rounded-2xl">
          {/* 제목과 설명은 4px로 붙는다. 기본 Header는 모바일에서 가운데 정렬이라 쓰지 않는다 */}
          <div className="flex flex-col gap-1">
            <AlertDialogTitle className="text-title-bold-18 text-foreground">
              {claim?.title}
            </AlertDialogTitle>
            {/* 낱말 가운데서 줄이 바뀌면 "상 / 태"처럼 읽힌다 */}
            <AlertDialogDescription className="text-body-medium-14 break-keep text-text-body-secondary">
              {claim?.description}
            </AlertDialogDescription>
          </div>
          {/* 기본 Footer는 회색 띠를 두르는데 시안은 카드 안에 버튼만 놓는다 */}
          <div className="flex gap-2">
            <AlertDialogCancel variant="secondary" className={DIALOG_BUTTON}>
              닫기
            </AlertDialogCancel>
            {/* 여기서 서버를 부르지 않는다. 사유를 받아야 접수가 되므로 신청 화면에 넘긴다 */}
            <AlertDialogAction className={DIALOG_BUTTON} asChild>
              <Link href={`/mypage/orders/${orderId}/claim?type=${opened}`}>{claim?.label}</Link>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
