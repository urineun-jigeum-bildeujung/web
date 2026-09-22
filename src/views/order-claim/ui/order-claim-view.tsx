// 반품·교환 신청 화면. 배송이 끝난 주문에서 상품과 수량을 고르고 사유를 남겨 접수한다.
//
// **이 화면은 Figma에 없다.** 주문 상세(`mypa_161`)와 같은 골격(회색 바닥 + 흰 카드)으로
// 맞추고 디자인 토큰만 썼다. 2026-09-21 PD 회신이 "아직 디자인 되지 않은 화면은 내일부터
// 작업해 전달"이라 곧 온다. **시안이 오면 교체 대상이다** (#327, #344).
//
// **기능명세서(`MYPA_261`)와 셋이 다르다.** 까닭은 서버가 받는 모양에 있다.
//
// ```
// 사유 라디오   → 여러 줄 입력   서버가 받는 것은 자유 문자열 하나다. 사유 코드가 없다
// 사진 첨부     → 없음          클레임용 presigned URL 엔드포인트가 없다
// 유형 드롭다운 → 진입 쿼리      주문 상세 확인창이 이미 유형을 정해 보낸다
// ```
//
// **취소는 여기로 오지 않는다.** 클레임은 배송완료 주문만 받으므로 취소를 보내면 늘 409다.
// 주문 취소는 `POST /orders/{orderId}/cancel`이고 주문 목록에 붙어 있다. PD팀이 2026-09-21에
// "취소 버튼 → 모달 → 취소버튼 클릭 시 취소"이고 "사유를 적는 건 반품과 환불만"이라고 확정했다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  claimableItems,
  toOrderStatus,
  useMutateClaim,
  useQueryOrderDetail,
  type ClaimType,
} from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppSuccess } from "@/shared/lib/app-toast";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { Label } from "@/shared/ui/label";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";

import { toRequestItems, toggleSelection, type ClaimSelection } from "../model/claim-selection";
import { ClaimItemRow } from "./claim-item-row";

/** 주문 상세가 넘기는 쿼리 값과 서버 `ClaimType`의 대응 */
const TYPE_BY_QUERY: Record<string, ClaimType> = {
  return: "RETURN",
  exchange: "EXCHANGE",
};

const TYPE_LABEL: Record<ClaimType, string> = {
  RETURN: "반품",
  EXCHANGE: "교환",
};

/** 서버 `@Size(max = 1000)` */
const REASON_MAX = 1000;

interface OrderClaimViewProps {
  orderId: string;
  type: string | undefined;
}

export function OrderClaimView({ orderId, type }: OrderClaimViewProps) {
  const router = useRouter();
  const { order, error, isLoading } = useQueryOrderDetail(orderId);
  const { request, isRequesting } = useMutateClaim(Number(orderId));

  const [selection, setSelection] = useState<ClaimSelection>({});
  const [reason, setReason] = useState("");

  const claimType = type ? TYPE_BY_QUERY[type] : undefined;
  const label = claimType ? TYPE_LABEL[claimType] : "반품·교환";

  // 서버가 보는 조건은 배송완료 **그리고** 7일 이내인데 응답에 배송일이 없다.
  // 화면은 상태까지만 보고 기간은 서버가 `ORDER_409_NOT_CLAIMABLE`로 알린다
  const delivered = order ? toOrderStatus(order.orderStatus) === "delivered" : false;
  const items = order ? claimableItems(order.items) : [];
  const picked = toRequestItems(selection);

  const backToDetail = (
    <Button variant="secondary" onClick={() => router.replace(`/mypage/orders/${orderId}`)}>
      주문 상세로 돌아가기
    </Button>
  );

  async function submit() {
    if (!claimType) {
      return;
    }
    await request({
      claimType,
      // 빈 문자열을 보내면 서버가 사유를 남긴 것으로 저장한다. 안 쓴 것은 안 보낸다
      reason: reason.trim() || undefined,
      items: picked,
    });
    toastAppSuccess(APP_MESSAGE_CODE.order.claimRequested);
    // 뒤로가기로 방금 접수한 화면에 돌아오지 않도록 이력을 갈아 끼운다
    router.replace(`/mypage/orders/${orderId}`);
  }

  /**
   * 신청할 수 없는 까닭. 없으면 폼을 그린다.
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
    if (items.length === 0) {
      return APP_MESSAGE[APP_MESSAGE_CODE.order.claimInProgress];
    }
    return null;
  })();

  return (
    <div className="flex min-h-dvh flex-col bg-surface-tertiary">
      <PageHeader title={`${label} 신청`} className="bg-card" />

      <main className="flex flex-1 flex-col gap-2 px-5 pt-3 pb-8">
        {isLoading && (
          <div className="flex flex-col gap-2 rounded-lg bg-card p-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!isLoading && blocked && (
          <EmptyState
            role={error ? "alert" : undefined}
            className="flex-1"
            icon={<Icon name="delivery" />}
            {...blocked}
            action={backToDetail}
          />
        )}

        {!isLoading && !blocked && (
          <>
            <section className="flex flex-col gap-3 rounded-lg bg-card p-4">
              <h2 className="text-title-bold-16 text-foreground">{label}할 상품</h2>
              {items.map((item) => (
                <ClaimItemRow
                  key={item.orderItemId}
                  item={item}
                  quantity={selection[item.orderItemId]}
                  onToggle={() =>
                    setSelection((current) => toggleSelection(current, item.orderItemId))
                  }
                  onQuantityChange={(next) =>
                    setSelection((current) => ({ ...current, [item.orderItemId]: next }))
                  }
                />
              ))}
            </section>

            <section className="flex flex-col gap-2 rounded-lg bg-card p-4">
              <Label htmlFor="claim-reason" className="text-title-bold-16 text-foreground">
                사유 (선택)
              </Label>
              <Textarea
                id="claim-reason"
                placeholder={`어떤 점이 문제였는지 알려주세요 (최대 ${REASON_MAX}자)`}
                maxLength={REASON_MAX}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="min-h-28"
              />
              <p className="self-end text-caption-regular-12 text-text-body-secondary">
                {reason.length}/{REASON_MAX}자
              </p>
            </section>
          </>
        )}
      </main>

      {!isLoading && !blocked && (
        <BottomActionBar>
          <Button disabled={picked.length === 0 || isRequesting} onClick={submit}>
            <LoadingSwap loading={isRequesting} label={`${label} 신청을 보내는 중`}>
              {label} 신청하기
            </LoadingSwap>
          </Button>
        </BottomActionBar>
      )}
    </div>
  );
}
