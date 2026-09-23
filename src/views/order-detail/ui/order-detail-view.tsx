// 주문 상세. 결제일·주문 상품·결제상세·배송지 정보를 카드로 나눠 보여준다.
// UI 시안 기준(mypa_161_준비중_주문상세 3324:37275, mypa_161_주문상세_배송완료 3324:36679)이다 (#405).
//
// 회색 바닥 위에 흰 카드 넷이 8px 간격으로 놓이고, 그 아래에 1:1 문의 안내가 온다.
// 맨 아래에는 배송 전이면 주문 취소(#410), 배송이 끝났으면 반품·교환 버튼이 붙는다.
//
// **카드 머리를 이 화면에서 직접 그린다.** 결제상세·배송지 블록은 주문 완료(`paym_002`)와
// 함께 쓰던 것인데, 2026-09-23 시안부터 제목·결제 일시·배송지 항목 이름의 글자가 주문 완료와
// 달라졌다. 공용 조각을 고치면 주문 완료까지 바뀌므로 줄만 `DetailRow`로 받아 여기서 조립한다.
// 결제 내역 줄(`PaymentDetail`)은 두 시안이 같아 그대로 쓴다.

"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  DetailRow,
  OrderProductRow,
  PaymentDetail,
  claimableItems,
  isWithinClaimPeriod,
  toOrderStatus,
  useQueryOrderDetail,
} from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { formatDisplayDate, formatDisplayDateTime } from "@/shared/lib/date/display-date";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { CancelOrderAction } from "./cancel-order-action";
import { ClaimActions } from "./claim-actions";
import { OrderDetailSkeleton } from "./order-detail-skeleton";

/** 배송지 항목. 이름이 진한 굵은 글씨, 값이 흐린 글씨다 (3324:36754) */
const DELIVERY_TERM = "text-label-bold-14 text-foreground";
const DELIVERY_VALUE = "text-body-medium-14 text-text-body-secondary";

/** 제목을 단 흰 카드. 결제일 카드만 제목이 없어 쓰지 않는다 */
function SectionCard({
  title,
  titleTrailing,
  children,
}: {
  title: string;
  /** 제목 오른쪽 값. 결제 일시처럼 제목과 짝을 이루는 것 */
  titleTrailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-card px-3 py-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-title-bold-18 text-foreground">{title}</h2>
        {titleTrailing && (
          <span className="text-caption-regular-13 text-text-body-tertiary">{titleTrailing}</span>
        )}
      </div>
      {children}
    </section>
  );
}

export function OrderDetailView({ orderId }: { orderId: string }) {
  const { order, error, isLoading } = useQueryOrderDetail(orderId);

  const status = order ? toOrderStatus(order.orderStatus) : null;
  const paidDate = order?.payment ? formatDisplayDate(order.payment.paidAt) : null;

  return (
    <div className="flex min-h-dvh flex-col bg-bg-secondary">
      {/* 시안은 머리말도 회색 바닥 그대로다. 옛 시안의 흰 머리말을 걷었다 */}
      <PageHeader title="주문 내역" />

      <main className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-8">
        {/* 처음 그릴 때라 뼈대를 둔다. 버튼의 대기 표시(LoadingSwap)는 취소 버튼(CancelOrderAction)이 든다 */}
        {isLoading && <OrderDetailSkeleton />}

        {/* 조회 실패는 토스트로 알리지 않는다(AppProviders 주석). 화면에서 무엇이 잘못됐는지 보여준다.
            **받아 둔 주문이 있으면 화면을 덮지 않는다** — 다시 받기가 실패해도 v5는 받아 둔 것을
            남긴 채 오류를 채워, 오류 화면 아래에 옛 주문과 그 버튼이 함께 그려졌다. 목록과 같다 (#426) */}
        {error && !order && (
          <EmptyState role="alert" className="flex-1" {...APP_MESSAGE[toAppMessageCode(error)]} />
        )}

        {/* 숫자가 아닌 주소로 들어오면 서버를 부르지 않아 실패도 아니고 내용도 없다.
            서버 404(`ORDER_404_ORDER_NOT_FOUND`)와 같은 문구를 쓴다 — 갈리면 같은 화면이 두 말을 한다 (#426) */}
        {!isLoading && !error && !order && (
          <EmptyState
            icon={<Icon name="delivery" />}
            {...APP_MESSAGE[APP_MESSAGE_CODE.order.notFound]}
          />
        )}

        {order && (
          <>
            <div className="flex flex-col gap-2">
              {/* 결제일·주문번호. 제목 없이 결제일이 맨 윗줄이다 */}
              <section
                aria-label="주문 정보"
                className="flex flex-col gap-2 rounded-xl bg-card p-3"
              >
                {/* 결제 전 주문에는 결제일이 없다. 지어낸 날짜를 보이느니 줄을 비운다 */}
                {paidDate && (
                  <p className="text-body-medium-18 text-foreground">결제일 {paidDate}</p>
                )}
                <dl>
                  <DetailRow
                    term={
                      <span className="text-label-bold-14 text-text-body-secondary">주문번호</span>
                    }
                    description={
                      <span className="text-body-medium-14 text-text-body-secondary">
                        {order.orderNumber}
                      </span>
                    }
                  />
                </dl>
              </section>

              {/* **상태 뱃지를 붙이지 않는다.** 2026-09-23 시안에서 빠졌다. 반품·교환 신청 상태
                  뱃지(#334)도 같이 걷었다 — 신청 건은 목록의 "취소·반품·교환" 탭이 보일 자리다 */}
              <SectionCard title={`주문 상품 ${order.items.length}개`}>
                <ul className="flex flex-col gap-4">
                  {order.items.map((item) => (
                    <li key={item.orderItemId}>
                      <OrderProductRow
                        name={item.productName}
                        quantity={item.quantity}
                        imageUrl={item.thumbnailUrl}
                        // `unitPrice`는 낱개 값이다. 명세 Example의 `productAmount`가 낱개 값의
                        // 합이라 수량을 곱해야 그 줄에 낸 돈이 된다
                        amount={item.unitPrice * item.quantity}
                      />
                    </li>
                  ))}
                </ul>
              </SectionCard>

              {/* 결제 전 주문에는 결제 정보가 없다. 빈 카드를 세우면 결제가 끝난 것처럼 보인다 */}
              {order.payment && (
                <SectionCard
                  title="결제상세"
                  titleTrailing={formatDisplayDateTime(order.payment.paidAt)}
                >
                  <PaymentDetail
                    total={order.totalAmount}
                    itemPrice={order.productAmount}
                    // 배송비 필드가 따로 없다. 기능명세서가 3,000원 고정으로 적어 두었고 명세
                    // Example의 차액도 3,000원이라 결제 금액에서 상품 금액을 뺀다 (#288)
                    shippingFee={order.totalAmount - order.productAmount}
                  />
                </SectionCard>
              )}

              <SectionCard title="배송지 정보">
                <dl className="flex flex-col gap-3">
                  <DetailRow
                    term={<span className={DELIVERY_TERM}>받는 사람</span>}
                    description={
                      <span className={DELIVERY_VALUE}>{order.deliveryAddress.receiver}</span>
                    }
                  />
                  <DetailRow
                    term={<span className={DELIVERY_TERM}>연락처</span>}
                    description={
                      <span className={DELIVERY_VALUE}>{order.deliveryAddress.receiverPhone}</span>
                    }
                  />
                  <DetailRow
                    stacked
                    term={<span className={DELIVERY_TERM}>배송지 주소</span>}
                    description={
                      // 도로명과 상세 주소가 따로 와서 한 줄로 합친다. 시안은 한 덩어리로 보여준다
                      <span className={DELIVERY_VALUE}>
                        {`${order.deliveryAddress.address} ${order.deliveryAddress.addressDetail}`.trim()}
                      </span>
                    }
                  />
                  {/* 요청사항 없이 주문할 수 있다. 빈 항목을 세우지 않는다 (#318) */}
                  {order.deliveryNote && (
                    <DetailRow
                      stacked
                      term={<span className={DELIVERY_TERM}>배송 요청사항</span>}
                      description={<span className={DELIVERY_VALUE}>{order.deliveryNote}</span>}
                    />
                  )}
                </dl>
              </SectionCard>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-center text-label-medium-14 text-foreground">
                헷갈리는 정보가 있다면 1:1로 자세히 안내해 드릴게요
              </p>
              {/* 시안의 32px 글자 버튼(3324:36768). 고객지원의 1:1 문의로 간다 */}
              <Link
                href="/mypage/support/inquiries"
                className="inline-flex h-8 items-center rounded-md px-2 text-label-medium-14 text-text-label-default underline"
              >
                1:1문의
              </Link>
            </div>

            {/* 배송이 끝나야 반품·교환을 접수할 수 있다(mypa_161_주문상세_배송완료). 배송 전에는
                주문 취소가 맞는 길이라 이 자리에 두지 않는다.

                **배송완료 뒤 7일까지만이다.** 기능명세서와 서버 `Order.isClaimableForReturn`이 같은
                규칙이라, 화면이 안 막으면 눌러 놓고 접수에서 거절당한다 (#374).

                **신청할 수 있는 상품이 하나도 없으면 감춘다.** 눌러 봐야 신청 화면이
                "신청 진행 중"으로 되돌려 보낸다 (#334) */}
            {status === "delivered" &&
              isWithinClaimPeriod(order.deliveredAt) &&
              claimableItems(order.items).length > 0 && <ClaimActions orderId={order.orderId} />}

            {/* 배송이 시작되기 전까지만 취소할 수 있다. 백엔드 전이 규칙도 `PAID`·`PREPARING`에서만
                취소를 허용하는데, 화면은 그 둘을 한 단계로 묶는다. 취소는 주문 전체라 목록이 아니라
                주문 전체가 보이는 이 자리에 둔다 — PD 시안(mypa_161_준비중_주문상세, #410) */}
            {status === "preparing" && <CancelOrderAction orderId={order.orderId} />}
          </>
        )}
      </main>
    </div>
  );
}
