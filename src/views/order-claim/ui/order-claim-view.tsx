// 취소·반품·교환 신청 화면.
//
// **아직 시안이 없어 접수까지 가지 못한다.** 기능명세서의 `MYPA_261`에는 유형 드롭다운·사유
// 라디오·사진 첨부·신청하기가 있는데 Figma에 그 프레임이 없다(2026-09-21 확인, PD팀 답은
// "우선순위 낮음"). 백엔드 `POST /orders/{orderId}/claims`는 열려 있어 화면만 오면 붙는다.
//
// 주문 상세의 확인창이 이 화면으로 데려오므로 빈 자리로 둘 수 없다. 왜 지금은 안 되는지
// 알리고 주문 상세로 돌아갈 길을 남긴다 — 배송 조회에서 쓴 방식과 같다 (#288).

import Link from "next/link";

import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";

const CLAIM_TYPE_LABEL = {
  cancel: "취소",
  return: "반품",
  exchange: "교환",
} as const;

function isClaimType(value: string | undefined): value is keyof typeof CLAIM_TYPE_LABEL {
  return value === "cancel" || value === "return" || value === "exchange";
}

const MESSAGE = APP_MESSAGE[APP_MESSAGE_CODE.order.claimPreparing];

interface OrderClaimViewProps {
  orderId: string;
  type: string | undefined;
}

export function OrderClaimView({ orderId, type }: OrderClaimViewProps) {
  // 진입할 때 받은 유형을 머리말에 세운다. 신청 화면이 오면 드롭다운 기본값이 될 자리다
  const label = isClaimType(type) ? CLAIM_TYPE_LABEL[type] : "취소·반품·교환";

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={`${label} 신청`} />

      <main className="flex flex-1 flex-col px-5 pb-8">
        <EmptyState
          className="flex-1"
          icon={<Icon name="delivery" />}
          title={MESSAGE.title}
          description={MESSAGE.description}
          action={
            <Button variant="secondary" asChild>
              <Link href={`/mypage/orders/${orderId}`}>주문 상세로 돌아가기</Link>
            </Button>
          }
        />
      </main>
    </div>
  );
}
