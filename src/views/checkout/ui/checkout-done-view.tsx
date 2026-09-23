// 주문 완료. 언제 도착하는지 먼저 알리고 무엇을 얼마에 샀는지 남긴다.
// UI 시안 기준(paym_002 521:17632)이다.
//
// 흰 바닥에 요약 카드 하나만 떠 있고 결제상세·배송지는 카드 없이 그대로 놓인다.
// 그 두 블록은 주문 상세(mypa_161)와 같아 `entities/order`의 조각을 쓴다 (#210).
//
// **클라이언트 컴포넌트다.** 결제 승인을 여기서 부르는데, 토큰이 브라우저에만 있어
// 서버 렌더에서는 인증이 실리지 않는다 (#308).

"use client";

import { useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import { IoImageOutline } from "react-icons/io5";

import {
  DeliveryDetail,
  DetailRow,
  DetailSection,
  PaymentDetail,
  useQueryOrderDetail,
  type OrderDetail,
} from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { APP_MESSAGE, APP_MESSAGE_CODE, type AppMessageCode } from "@/shared/config/app-message";
import { formatDisplayDateTime } from "@/shared/lib/date/display-date";

import { useMarkOrdersStale } from "../api/use-mark-orders-stale";
import { useQueryPaymentConfirm } from "../api/use-query-payment-confirm";
import { clearPendingOrder } from "../model/pending-order";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

import { CopyOrderNumber } from "./copy-order-number";

/**
 * 대표로 보일 상품 한 줄.
 *
 * 시안(`paym_002`)이 상품 줄을 하나만 그린다. 여럿이면 첫 줄을 세우고 나머지는 수로 알린다 —
 * 주문 목록과 같은 방식이다 (#297).
 */
function toProductRow(order: OrderDetail) {
  const [first, ...rest] = order.items;
  if (!first) {
    return null;
  }

  return {
    name: first.productName,
    caption: rest.length > 0 ? `${first.quantity}개 외 ${rest.length}건` : `${first.quantity}개`,
    imageUrl: first.thumbnailUrl,
  };
}

/**
 * 승인 시각을 화면 형식으로 옮긴다.
 *
 * 시안(`paym_002`)이 `26.08.28 15:43`으로 쓴다. 값이 없거나 읽을 수 없으면 줄을 비운다 —
 * 지어낸 날짜를 보이느니 안 보이는 편이 낫다.
 */
function formatPaidAt(approvedAt: string | undefined) {
  return approvedAt ? formatDisplayDateTime(approvedAt) : null;
}

/**
 * 승인 실패를 결제 맥락의 문구로 옮긴다.
 *
 * **일반 실패 문구를 그대로 쓰면 안 된다.** 네트워크 오류는 평소에 "네트워크 상태를 확인해
 * 주세요"로 떨어지는데, 이 화면에서 그 말은 다시 시도하라는 뜻으로 읽힌다. 결제창에서는 이미
 * 성공한 뒤라 그 행동이 두 번 결제로 이어질 수 있다.
 */
function toConfirmFailureCode(error: unknown): AppMessageCode {
  const code = toAppMessageCode(error);
  return code.startsWith("payment.") ? code : APP_MESSAGE_CODE.payment.confirmFailed;
}

/**
 * 승인이 실패했을 때 라우트가 넘기는 것.
 *
 * **주문번호를 들고 온다.** 승인 응답이 없으니 화면이 댈 수 있는 식별자가 토스에서 받은
 * 이 값뿐이고, 문의할 때 사용자가 부르는 번호다.
 */
export type PaymentFailure = {
  /** 토스가 복귀 쿼리에 실어 보낸 문자열 주문번호 (`ORD-…`) */
  orderId: string;
  code: AppMessageCode;
};

type CheckoutDoneViewProps = {
  /** 토스가 복귀 쿼리에 실어 보낸 값들. 이것으로 승인을 부른다 */
  paymentKey?: string;
  /** 토스가 `orderId`로 붙이는 문자열 주문번호 (`ORD-…`) */
  tossOrderId?: string;
  amount: number;
  /**
   * 방금 산 주문의 숫자 id. 복귀 주소에 우리가 실어 보낸 값이다 (#301).
   *
   * 주소창으로 직접 들어오면 없다. 그때는 상세 대신 주문 내역으로 보낸다.
   */
  orderId?: number | null;
};

/**
 * 승인이 끝나지 않았을 때의 화면.
 *
 * **다시 결제하러 가는 길을 주지 않는다.** 여기까지 왔다는 것은 결제창에서 성공했다는
 * 뜻이라 이미 돈이 빠져나갔을 수 있다. 다시 누를 자리를 만들면 두 번 결제될 여지가 생긴다.
 * 대신 주문번호를 크게 보여주고 문의로 보낸다 (#260).
 *
 * **시안에 없는 화면이다.** `paym_002`는 성공만 그려서 공용 조각으로 조립했다. PD 확인 대상.
 */
function ConfirmFailure({ failure }: { failure: PaymentFailure }) {
  // 문구 중에는 제목만 있는 것도 있다. 모르는 백엔드 코드가 그런 기본 문구로 떨어질 수 있다
  const message = APP_MESSAGE[failure.code];

  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center px-5 text-center">
      <Icon name="notice" className="size-25.5 text-icon-fill-light-red" />
      <p className="mt-7 text-title-bold-20 text-foreground">{message.title}</p>
      {"description" in message && (
        <p className="mt-4 text-body-medium-14 whitespace-pre-line text-text-body-secondary">
          {message.description}
        </p>
      )}

      {/* 문의할 때 대는 유일한 식별자다. 손으로 옮겨 적지 않게 복사까지 붙인다.
          고르기(`select-all`)도 남겨 둔다 — 클립보드가 막히는 맥락이 있다 (#261 리뷰) */}
      <dl className="mt-8 flex w-full items-center justify-between gap-2 rounded-lg bg-surface-secondary py-2 pr-2 pl-4">
        <div className="flex min-w-0 flex-col gap-1 text-left">
          <dt className="text-label-bold-14 text-foreground">주문번호</dt>
          <dd className="truncate text-body-regular-14 text-text-body-secondary select-all">
            {failure.orderId}
          </dd>
        </div>
        <CopyOrderNumber orderNumber={failure.orderId} />
      </dl>
    </div>
  );
}

/**
 * 승인이 막혔을 때의 화면.
 *
 * **대기 분기보다 먼저 선다.** 여기까지 온 것은 결제창에서 성공했다는 뜻이고 그 시점엔 이미
 * 돈이 나갔을 수 있다. 주문 조회가 아직이라고 뼈대로 덮으면 문의할 수단을 못 쥔다 (#308 리뷰).
 */
function ConfirmFailureScreen({ failure }: { failure: PaymentFailure }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        leading="none"
        right={
          <Link
            href="/"
            aria-label="닫기"
            className="flex size-11 items-center justify-center text-foreground"
          >
            <Icon name="cancel" />
          </Link>
        }
      />

      <main className="flex flex-1 flex-col">
        <ConfirmFailure failure={failure} />
      </main>

      {/* 다시 결제하러 보내지 않는다. 문의와 주문 내역 확인만 남긴다 */}
      <BottomActionBar className="[&>*]:h-12">
        <Button
          variant="secondary"
          className="bg-surface-tertiary text-foreground hover:bg-surface-tertiary/80"
          asChild
        >
          <Link href="/mypage/support">문의하기</Link>
        </Button>
        <Button asChild>
          <Link href="/mypage/orders">주문 내역 보기</Link>
        </Button>
      </BottomActionBar>
    </div>
  );
}

export function CheckoutDoneView({
  paymentKey,
  tossOrderId,
  amount,
  orderId,
}: CheckoutDoneViewProps) {
  const { payment, error, isConfirming, canConfirm } = useQueryPaymentConfirm({
    paymentKey,
    tossOrderId,
    amount,
  });

  // **결제창을 통과한 주문은 더 이상 재사용 대상이 아니다.** 들고 있던 것을 비우지 않으면
  // 다음 장바구니에서 그 주문으로 결제를 시도한다 (#367). 승인 실패도 마찬가지다 —
  // 그 주문은 이미 결제창을 거쳤으므로 새 결제를 붙일 자리가 아니다
  useEffect(() => {
    if (canConfirm) {
      clearPendingOrder();
    }
  }, [canConfirm]);

  // **숫자 주문 id는 승인 응답이 준다.** 주소창의 `?order=`는 사용자가 바꿀 수 있으므로
  // 승인이 끝나면 그쪽을 믿지 않는다. 승인을 기다리는 동안에는 쿼리로 먼저 조회를 걸어
  // 왕복을 겹쳐 둔다 — 값이 다르면 키가 바뀌며 다시 조회한다 (#374)
  const resolvedOrderId = payment?.orderId ?? orderId;

  // **상품과 배송지는 승인 응답에 없다.** 주문을 다시 조회해 채운다 (#301·#308)
  const {
    order: fetched,
    isLoading: isLoadingOrder,
    isFetching: isFetchingOrder,
  } = useQueryOrderDetail(resolvedOrderId ? String(resolvedOrderId) : "");

  // **승인과 조회가 끝나면 주문 캐시를 낡은 것으로 표시한다.** 이 화면이 받은 상세는 승인 전
  // 모습이라, 두면 60초 동안 주문 상세가 결제상세와 취소 버튼이 빠진 채 뜬다 (#416).
  // 처음 받기뿐 아니라 받아 둔 것을 뒤에서 다시 받는 중에도 기다린다 — 그 응답이 끝나며 표시를
  // 지운다 (#419 리뷰).
  // 대기 표시 없음 — 화면이 아니라 캐시를 다루는 자리다. 이 화면의 대기는 아래 뼈대가 맡는다
  useMarkOrdersStale(Boolean(payment) && !isFetchingOrder);

  // **승인 결과와 같은 주문인지 본다.** 승인 전에는 주소창의 `?order=`로 조회하므로 그 사이에
  // 이 결제의 금액과 다른 주문의 상품·배송지가 한 화면에 섞일 수 있다 (#308 리뷰).
  // 승인 전이거나 주문을 못 받았으면 견줄 것이 없어 그대로 둔다
  const mismatched = Boolean(payment && fetched && payment.orderNumber !== fetched.orderNumber);
  const order = mismatched ? undefined : fetched;
  const row = order ? toProductRow(order) : null;

  // 승인이 실패하면 화면이 댈 수 있는 식별자가 토스에서 받은 주문번호뿐이다
  const failure: PaymentFailure | null =
    error && tossOrderId ? { orderId: tossOrderId, code: toConfirmFailureCode(error) } : null;

  // **결제를 마치고 온 주소가 아니다.** 주소창으로 직접 들어왔거나 쿼리가 빠진 경우인데,
  // 그대로 두면 아무 일도 없었는데 "주문을 무사히 마쳤어요"가 뜬다 (#308 리뷰)
  if (!canConfirm) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader leading="none" />
        <main className="flex flex-1 flex-col">
          <EmptyState
            role="alert"
            className="flex-1"
            icon={<Icon name="notice" />}
            title="결제 정보를 찾을 수 없어요"
            description={"결제를 마치고 돌아온 주소가 아니에요.\n주문 내역에서 확인해 주세요."}
          />
        </main>
        <BottomActionBar className="[&>*]:h-12">
          <Button asChild>
            <Link href="/mypage/orders">주문 내역 보기</Link>
          </Button>
        </BottomActionBar>
      </div>
    );
  }

  // **실패를 대기보다 먼저 본다.** 승인이 막힌 것은 확정된 사실이고 그 시점엔 이미 돈이
  // 나갔을 수 있다. 주문 조회가 아직 끝나지 않았다고 뼈대로 덮으면, 사용자가 문의할 수단을
  // 손에 쥐지 못한 채 기다리게 된다 (#308 리뷰)
  if (failure) {
    return <ConfirmFailureScreen failure={failure} />;
  }

  // 승인이 끝나도 주문을 받는 중이면 자리를 잡는다. 먼저 그리면 상품이 비고 금액이 0원이 된다
  if (isConfirming || isLoadingOrder) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader leading="none" />
        <main
          role="status"
          aria-label="결제를 확인하는 중"
          className="flex flex-1 flex-col gap-6 px-5 pt-3 pb-8"
        >
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="h-30 w-full rounded-lg" />
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 되돌아갈 곳이 없는 화면이라 뒤로가기 대신 닫기를 오른쪽에 둔다 (paym_002) */}
      <PageHeader
        leading="none"
        right={
          <Link
            href="/"
            aria-label="닫기"
            className="flex size-11 items-center justify-center text-foreground"
          >
            <Icon name="cancel" />
          </Link>
        }
      />

      <main className="flex flex-1 flex-col gap-6 px-5 pt-3 pb-8">
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-title-bold-16 text-foreground">주문을 무사히 마쳤어요</h1>
            <p className="text-body-medium-14 text-text-body-secondary">
              상품이 출발하면 알림으로 가장 먼저 알려드릴게요
            </p>
          </div>

          {/* 시안의 그림자는 `0 0 11.35px` 한 겹인데 토큰 다섯 단계는 모두 두 겹에 y 오프셋이 있다.
              가장 가까운 `shadow-sm`(blur 12px)으로 옮겼다 */}
          <section className="flex w-full flex-col gap-2 rounded-lg bg-card py-4 shadow-sm">
            {/* 카드는 위아래 여백만 갖고 좌우 여백은 안쪽 줄이 각자 가진다 (paym_002) */}
            <dl className="px-3">
              <DetailRow
                term={<span className="text-label-bold-14 text-foreground">주문번호</span>}
                description={
                  <span className="text-body-regular-14 text-text-body-secondary">
                    {payment?.orderNumber ?? order?.orderNumber}
                  </span>
                }
              />
            </dl>

            {/* 주문을 못 받아 왔거나 다른 주문이면 이 줄을 세우지 않는다. 빈 이름과
                사진 자리만 남으면 상품이 없는 주문처럼 보인다 (#308 리뷰) */}
            {row && (
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 px-3">
                  {/* 사진이 없으면 자리만 잡는다. 디자인 시스템 icon 43종에 이미지 글리프가
                    없어 react-icons로 채운다 (AGENTS.md 5.3) */}
                  <span
                    aria-hidden
                    className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-tertiary text-icon-fill-secondary"
                  >
                    {row?.imageUrl ? (
                      <Image src={row.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <IoImageOutline className="size-8" />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate text-title-bold-16 text-foreground">{row?.name}</p>
                    <p className="truncate text-body-medium-14 text-text-body-secondary">
                      {row?.caption}
                    </p>
                  </div>
                </div>

                {/* **도착 예정일 줄은 그리지 않는다.** 시안(`paym_002`)에는 있지만 서버가 그 값을
                  주지 않는다. 시안 문구를 그대로 두면 오늘이 며칠이든 `9/3`이라 지난 날짜가
                  모든 주문에 뜬다 (#262). 배송일을 받게 되면 `DeliveryNotice`로 되살린다 */}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <DetailSection title="결제상세" titleTrailing={formatPaidAt(payment?.approvedAt)}>
            {/* **주문이 없으면 세부 금액을 비운다.** 결제 금액만 알고 그 안을 가를 수 없는데
                `0원`으로 그리면 실제로 0원인 것처럼 보인다 (#308 리뷰) */}
            <PaymentDetail
              total={payment?.amount ?? order?.totalAmount ?? 0}
              itemPrice={order?.productAmount}
              // 배송비 필드가 따로 없다. 결제 금액에서 상품 금액을 뺀다 (주문 상세와 같은 방식)
              shippingFee={order && order.totalAmount - order.productAmount}
            />
          </DetailSection>

          {/* 주문을 못 받아 오면 이 블록을 세우지 않는다. 빈 칸을 남기면 배송지가 없는
              주문처럼 보인다 */}
          {order && (
            <DetailSection title="배송지 정보">
              <DeliveryDetail
                receiver={order.deliveryAddress.receiver}
                phone={order.deliveryAddress.receiverPhone}
                address={`${order.deliveryAddress.address} ${order.deliveryAddress.addressDetail}`.trim()}
                request={order.deliveryNote}
              />
            </DetailSection>
          )}
        </div>
      </main>

      {/* 시안(paym_002)이 둘을 나란히 둔다. 방금 한 주문을 바로 확인할 수 있어야
          주문 내역을 다시 찾아 들어가지 않는다. 시안 버튼이 48px이라 기본 44px을 덮는다 */}
      <BottomActionBar className="[&>*]:h-12">
        <Button
          variant="secondary"
          className="bg-surface-tertiary text-foreground hover:bg-surface-tertiary/80"
          asChild
        >
          {/* **승인 응답에는 주문 상세로 갈 식별자가 없다.** 계약이 주는 것은 표시용
              `orderNumber`(`ORD-…`)뿐인데 이 라우트는 숫자 주문 id를 받는다. 그래서
              [1] 주문 생성이 돌려준 id를 복귀 주소에 실어 건너 온다 (#301).

              **그 주문을 실제로 받아 왔을 때만 상세로 보낸다.** 값이 없거나 승인 결과와
              다른 주문이면 엉뚱한 주문을 여는 셈이라 목록이 낫다. 문구도 가는 곳에 맞춘다 */}
          <Link
            href={resolvedOrderId && order ? `/mypage/orders/${resolvedOrderId}` : "/mypage/orders"}
          >
            {resolvedOrderId && order ? "주문 상세 보기" : "주문 내역 보기"}
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">홈으로 가기</Link>
        </Button>
      </BottomActionBar>
    </div>
  );
}
