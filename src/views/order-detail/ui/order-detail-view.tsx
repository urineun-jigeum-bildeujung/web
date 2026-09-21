// 주문 상세. 주문정보·결제상세·배송지 정보를 카드로 나눠 보여준다.
// UI 시안 기준(mypa_161 1238:10016, mypa_161_배송완료 302:11585)이다.
//
// 회색 바닥 위에 흰 카드 셋이 8px 간격으로 놓인다. 카드마다 안쪽 간격이 달라
// `DetailSection`은 결제상세·배송지에만 쓰고 주문정보는 여기서 직접 조립한다.
//
// 결제상세·배송지 내용은 주문 완료(`paym_002`)와 같아 `entities/order`의 조각을 쓴다 (#210).

"use client";

import {
  DeliveryDetail,
  DetailRow,
  DetailSection,
  OrderProductRow,
  OrderStatusBadge,
  PaymentDetail,
  toOrderStatus,
  useQueryOrderDetail,
} from "@/entities/order";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { formatDisplayDateTime } from "@/shared/lib/date/display-date";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { ClaimActions } from "./claim-actions";
import { OrderDetailSkeleton } from "./order-detail-skeleton";

export function OrderDetailView({ orderId }: { orderId: string }) {
  const { order, error, isLoading } = useQueryOrderDetail(orderId);

  const status = order ? toOrderStatus(order.orderStatus) : null;

  return (
    <div className="flex min-h-dvh flex-col bg-surface-tertiary">
      {/* 시안은 머리말 영역만 흰 바닥이다 */}
      <PageHeader title="자세히 보기" className="bg-card" />

      <main className="flex flex-1 flex-col gap-2 px-5 pt-3 pb-8">
        {isLoading && <OrderDetailSkeleton />}

        {/* 조회 실패는 토스트로 알리지 않는다(AppProviders 주석). 화면에서 무엇이 잘못됐는지 보여준다 */}
        {error && (
          <EmptyState role="alert" className="flex-1" {...APP_MESSAGE[toAppMessageCode(error)]} />
        )}

        {/* 숫자가 아닌 주소로 들어오면 서버를 부르지 않아 실패도 아니고 내용도 없다 */}
        {!isLoading && !error && !order && (
          <EmptyState
            icon={<Icon name="delivery" />}
            title="주문을 찾을 수 없어요"
            description="주소가 맞는지 확인해 주세요"
          />
        )}

        {order && (
          <>
            {/* 주문정보는 제목·주문번호가 한 덩어리(8px)이고 상품 줄이 12px 뒤에 온다 */}
            <section className="flex flex-col gap-5 rounded-xl bg-card px-3 py-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <h2 className="text-title-bold-20 text-foreground">주문정보</h2>
                  <dl>
                    <DetailRow
                      term={<span className="text-label-bold-14 text-foreground">주문번호</span>}
                      description={
                        <span className="text-body-regular-14 text-text-body-secondary">
                          {order.orderNumber}
                        </span>
                      }
                    />
                  </dl>
                </div>

                {order.items.map((item, index) => (
                  <OrderProductRow
                    key={item.orderItemId}
                    name={item.productName}
                    // 시안의 둘째 줄은 "상품 옵션" 자리인데 옵션이라는 데이터가 없다. PD팀이
                    // "옵션은 빼고 수량은 있어도 괜찮다"고 확인해 줬다 (#297)
                    option={`${item.quantity}개`}
                    imageUrl={item.thumbnailUrl}
                    // `unitPrice`는 낱개 값이다. 명세 Example의 `productAmount`가 낱개 값의
                    // 합이라 수량을 곱해야 그 줄에 낸 돈이 된다
                    amount={item.unitPrice * item.quantity}
                    nameTrailing={
                      // 뱃지는 첫 줄에만 붙인다. 이것은 주문 단위 상태라 줄마다 반복하면
                      // 상품별 상태처럼 읽힌다. 응답의 `itemStatus`가 그 자리인데 값 목록을
                      // 알지 못해 아직 쓰지 않는다 (entities/order/model/order-status.ts)
                      index === 0 && status ? (
                        <OrderStatusBadge status={status} className="shrink-0" />
                      ) : null
                    }
                  />
                ))}
              </div>

              {/* 배송이 끝나야 반품·교환을 접수할 수 있다(mypa_161_배송완료). 배송 전에는
                  주문 취소가 맞는 길이라 이 자리에 두지 않는다.

                  **기능명세서는 "배송완료 후 7일 이내"로 더 좁힌다.** 응답에 배송완료 시각이
                  없어 그 판정을 못 하므로 지금은 배송완료 상태 전체에 내보낸다 (#288) */}
              {status === "delivered" && <ClaimActions orderId={order.orderId} />}
            </section>

            {/* 결제 전 주문에는 결제 정보가 없다. 빈 카드를 세우면 결제가 끝난 것처럼 보인다 */}
            {order.payment && (
              <DetailSection
                title="결제상세"
                titleTrailing={formatDisplayDateTime(order.payment.paidAt)}
                className="rounded-xl bg-card px-3 py-4"
              >
                <PaymentDetail
                  total={order.totalAmount}
                  itemPrice={order.productAmount}
                  // 배송비 필드가 따로 없다. 기능명세서가 3,000원 고정으로 적어 두었고 명세
                  // Example의 차액도 3,000원이라 결제 금액에서 상품 금액을 뺀다 (#288)
                  shippingFee={order.totalAmount - order.productAmount}
                  payMethod={order.payment.method}
                />
              </DetailSection>
            )}

            <DetailSection title="배송지 정보" className="rounded-xl bg-card px-3 py-4">
              <DeliveryDetail
                receiver={order.deliveryAddress.receiver}
                phone={order.deliveryAddress.receiverPhone}
                // 도로명과 상세 주소가 따로 와서 한 줄로 합친다. 시안은 한 덩어리로 보여준다
                address={`${order.deliveryAddress.address} ${order.deliveryAddress.addressDetail}`.trim()}
                request={order.deliveryNote}
              />
            </DetailSection>
          </>
        )}
      </main>
    </div>
  );
}
