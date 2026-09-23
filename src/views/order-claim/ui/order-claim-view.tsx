// 반품·교환 신청 화면. 배송이 끝난 주문에서 ① 상품 고르기 → ② 사유·사진 → ③ 수거·안내 순으로 받아 접수한다.
// UI 시안 기준(mypa_261·262·361·362, 2026-09-23 PD 완성본)이다 (#408).
//
// **단계는 URL(`?step=`)에, 입력값은 이 화면의 상태로 든다.** 세 단계가 한 화면 안에서 바뀌어
// 값이 그대로 남는다. 저장소(zustand)를 따로 두면 다른 주문으로 들어갈 때 비우는 일만 는다.
// 새로고침하면 값이 사라지므로 `reachableStep`이 값이 있는 단계까지 당긴다.
//
// **서버가 받지 않는 값(사유 보기·수거 희망일·요청사항)은 사유 글 하나에 묶어 보낸다**
// (model/to-claim-request). 사진은 접수할 때 훅이 올린다.
//
// **취소는 여기로 오지 않는다.** 클레임은 배송완료 주문만 받으므로 취소를 보내면 늘 409다.
// 주문 취소는 `POST /orders/{orderId}/cancel`이고 주문 목록에 붙어 있다. PD팀이 2026-09-21에
// "취소 버튼 → 모달 → 취소버튼 클릭 시 취소"이고 "사유를 적는 건 반품과 환불만"이라고 확정했다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

import {
  claimableItems,
  isWithinClaimPeriod,
  toOrderStatus,
  useMutateClaim,
  useQueryOrderDetail,
  type ClaimType,
} from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppSuccess } from "@/shared/lib/app-toast";
import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

import type { ClaimReason } from "../model/claim-reasons";
import type { ClaimSelection } from "../model/claim-selection";
import { CLAIM_STEPS, reachableStep } from "../model/claim-steps";
import { pickupDateOptions } from "../model/pickup-dates";
import { toCreateClaimRequest } from "../model/to-claim-request";
import { ClaimItemsStep } from "./claim-items-step";
import { ClaimPickupStep } from "./claim-pickup-step";
import { ClaimReasonStep } from "./claim-reason-step";

/** 주문 상세가 넘기는 쿼리 값과 서버 `ClaimType`의 대응 */
const TYPE_BY_QUERY: Record<string, ClaimType> = {
  return: "RETURN",
  exchange: "EXCHANGE",
};

const TYPE_LABEL: Record<ClaimType, string> = {
  RETURN: "반품",
  EXCHANGE: "교환",
};

interface OrderClaimViewProps {
  orderId: string;
  type: string | undefined;
}

export function OrderClaimView({ orderId, type }: OrderClaimViewProps) {
  const router = useRouter();
  const { order, error, isLoading } = useQueryOrderDetail(orderId);
  const { request, isRequesting } = useMutateClaim(Number(orderId));

  const [step, setStep] = useQueryState(
    "step",
    // 기기 뒤로가기로 이전 단계에 가야 한다. 기본값 replace면 ③에서 뒤로가기를 누를 때 신청을
    // 통째로 떠나 적어 둔 사유가 사라진다. 단계가 바뀌면 새 화면이라 맨 위부터 보인다
    parseAsStringLiteral(CLAIM_STEPS)
      .withDefault("items")
      .withOptions({ history: "push", scroll: true }),
  );

  const [selection, setSelection] = useState<ClaimSelection>({});
  const [reason, setReason] = useState<ClaimReason | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [detail, setDetail] = useState("");
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [pickupRequest, setPickupRequest] = useState("");
  // 보기 두 날은 화면에 머무는 동안 바뀌지 않게 처음 한 번만 센다
  const [dateOptions] = useState(() => pickupDateOptions(new Date()));

  const claimType = type ? TYPE_BY_QUERY[type] : undefined;
  const label = claimType ? TYPE_LABEL[claimType] : "반품·교환";

  // 서버가 보는 조건은 배송완료 **그리고** 배송완료 뒤 7일 이내다(`Order.isClaimableForReturn`).
  // 둘 다 화면에서 막는다 — 안 막으면 사유까지 다 적고 나서 거절당한다 (#374)
  const delivered = order
    ? toOrderStatus(order.orderStatus) === "delivered" && isWithinClaimPeriod(order.deliveredAt)
    : false;
  const claimableIds = order ? claimableItems(order.items).map((item) => item.orderItemId) : [];
  // 주문에 담긴 순서를 지킨다. 고른 순서로 늘어놓으면 ②·③의 줄 순서가 ①과 달라진다
  const pickedItems = order
    ? order.items.filter((item) => selection[item.orderItemId] !== undefined)
    : [];
  const current = reachableStep(step, {
    picked: pickedItems.length > 0,
    reasoned: reason !== null,
  });

  // 새로고침으로 값이 비어 앞 단계로 당겨졌으면 주소도 맞춘다. 되돌린 것이라 이력을 쌓지 않는다
  useEffect(() => {
    if (current !== step) {
      void setStep(current, { history: "replace" });
    }
  }, [current, step, setStep]);

  async function submit() {
    if (!claimType || reason === null || pickupDate === null) {
      return;
    }
    await request({
      request: toCreateClaimRequest(claimType, {
        selection,
        reason,
        detail,
        pickupDate,
        pickupRequest,
      }),
      photos,
    });
    toastAppSuccess(APP_MESSAGE_CODE.order.claimRequested);
    // 뒤로가기로 방금 접수한 화면에 돌아오지 않도록 이력을 갈아 끼운다
    router.replace(`/mypage/orders/${orderId}`);
  }

  /**
   * 신청할 수 없는 까닭. 없으면 단계를 그린다.
   *
   * `AppMessage` 중에는 `description`이 없는 것이 있어 넓게 받는다.
   */
  const blocked: { title: string; description?: string } | null = (() => {
    if (!claimType) {
      return { title: "신청 유형 없음", description: "주문 상세에서 다시 눌러 주세요." };
    }
    if (error) {
      return APP_MESSAGE[toAppMessageCode(error)];
    }
    if (!order) {
      return { title: "주문 없음", description: "주소가 맞는지 확인해 주세요." };
    }
    if (!delivered) {
      return APP_MESSAGE[APP_MESSAGE_CODE.order.notClaimable];
    }
    if (claimableIds.length === 0) {
      return APP_MESSAGE[APP_MESSAGE_CODE.order.claimInProgress];
    }
    return null;
  })();

  // 시안은 ①만 흰 바탕에 머리말이 "주문 내역"이고 ②·③은 회색 바탕에 "○○ 신청"이다
  const onItems = current === "items";
  const ready = !isLoading && !blocked && order && claimType;

  return (
    <div className={cn("flex min-h-dvh flex-col", onItems ? "bg-background" : "bg-bg-secondary")}>
      <PageHeader title={onItems ? "주문 내역" : `${label} 신청`} />

      <main className="flex flex-1 flex-col">
        {isLoading && (
          <div role="status" className="flex flex-col gap-3 px-5 pt-3">
            <span className="sr-only">신청할 주문을 불러오는 중</span>
            <Skeleton aria-hidden className="h-6 w-24" />
            <Skeleton aria-hidden className="h-24 w-full rounded-2xl" />
            <Skeleton aria-hidden className="h-24 w-full rounded-2xl" />
          </div>
        )}

        {!isLoading && blocked && (
          <EmptyState
            role={error ? "alert" : undefined}
            className="flex-1"
            icon={<Icon name="delivery" />}
            {...blocked}
            action={
              <Button
                variant="secondary"
                onClick={() => router.replace(`/mypage/orders/${orderId}`)}
              >
                주문 상세로 돌아가기
              </Button>
            }
          />
        )}

        {ready && current === "items" && (
          <ClaimItemsStep
            items={order.items}
            claimableIds={claimableIds}
            selection={selection}
            onSelectionChange={setSelection}
          />
        )}

        {ready && current === "reason" && (
          <ClaimReasonStep
            label={label}
            items={pickedItems}
            selection={selection}
            onQuantityChange={(orderItemId, next) =>
              setSelection((prev) => ({ ...prev, [orderItemId]: next }))
            }
            reason={reason}
            onReasonChange={setReason}
            photos={photos}
            onPhotosChange={setPhotos}
            detail={detail}
            onDetailChange={setDetail}
          />
        )}

        {ready && current === "pickup" && (
          <ClaimPickupStep
            claimType={claimType}
            lines={pickedItems.map((item) => ({
              orderItemId: item.orderItemId,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: selection[item.orderItemId] ?? 1,
            }))}
            dateOptions={dateOptions}
            pickupDate={pickupDate}
            onPickupDateChange={setPickupDate}
            pickupRequest={pickupRequest}
            onPickupRequestChange={setPickupRequest}
          />
        )}
      </main>

      {ready && (
        // 시안은 버튼 위 12다. ②·③은 바탕이 회색이라 버튼 줄도 회색으로 맞춘다
        <BottomActionBar className={cn("pt-3", !onItems && "bg-bg-secondary")}>
          {current === "items" && (
            <Button disabled={pickedItems.length === 0} onClick={() => void setStep("reason")}>
              {label} 신청하기
            </Button>
          )}
          {current === "reason" && (
            <Button disabled={reason === null} onClick={() => void setStep("pickup")}>
              다음
            </Button>
          )}
          {current === "pickup" && (
            // **거부를 여기서 받는다.** `request`가 `mutateAsync`라 실패하면 던지는데,
            // `onClick`에 그대로 넘기면 받아 줄 곳이 없어 처리되지 않은 거부가 된다.
            // 접수는 서버가 세 가지로 막는다 — 진행 중인 신청·수량 초과·기간 경과 (#358).
            // 문구는 `MutationCache.onError`가 전역으로 띄우므로 여기서 또 띄우지 않는다
            <Button
              disabled={pickupDate === null || isRequesting}
              onClick={() => void submit().catch(() => undefined)}
            >
              <LoadingSwap loading={isRequesting} label={`${label} 신청을 보내는 중`}>
                {label} 신청 완료하기
              </LoadingSwap>
            </Button>
          )}
        </BottomActionBar>
      )}
    </div>
  );
}
