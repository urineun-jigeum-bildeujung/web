// 주문 상세. 주문정보·결제상세·배송지 정보를 카드로 나눠 보여준다.
// UI 시안 기준(mypa_161 1238:10016, mypa_161_배송완료 302:11585)이다.
//
// 회색 바닥 위에 흰 카드 셋이 8px 간격으로 놓인다. 카드마다 안쪽 간격이 달라
// `DetailSection`은 결제상세·배송지에만 쓰고 주문정보는 여기서 직접 조립한다.
//
// 결제상세·배송지 내용은 주문 완료(`paym_002`)와 같아 `entities/order`의 조각을 쓴다 (#210).

import {
  DeliveryDetail,
  DetailRow,
  DetailSection,
  OrderProductRow,
  OrderStatusBadge,
  PaymentDetail,
  type OrderStatus,
} from "@/entities/order";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { ClaimActions } from "./claim-actions";

/** API 연동 전까지 화면 확인용 값. 주문마다 달라 보이도록 번호와 상태를 나눠 둔다. */
const MOCK_ORDERS: Record<string, { orderNo: string; status: OrderStatus }> = {
  "1": { orderNo: "20260829-1234567", status: "preparing" },
  "2": { orderNo: "20260829-1234568", status: "shipping" },
  "3": { orderNo: "20260829-1234569", status: "delivered" },
  "4": { orderNo: "20260829-1234570", status: "confirmed" },
};

const MOCK = {
  productName: "상품명",
  option: "상품 옵션",
  paidAt: "26.08.28 15:43",
  total: 12345,
  itemPrice: 14345,
  shippingFee: 3000,
  card: "신한카드 ****-****-****-1234",
  receiver: "천경진",
  phone: "010-1234-5678",
  address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호",
  request: "문 앞에 놓아주세요.",
};

export function OrderDetailView({ orderId }: { orderId?: string }) {
  // 주문마다 다른 화면이 나와야 목록에서 무엇을 눌렀는지 알 수 있다.
  const order = (orderId && MOCK_ORDERS[orderId]) || MOCK_ORDERS["1"];

  return (
    <div className="flex min-h-dvh flex-col bg-surface-tertiary">
      {/* 시안은 머리말 영역만 흰 바닥이다 */}
      <PageHeader title="자세히 보기" className="bg-card" />

      <main className="flex flex-1 flex-col gap-2 px-5 pt-3 pb-8">
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
                      {order.orderNo}
                    </span>
                  }
                />
              </dl>
            </div>

            <OrderProductRow
              name={MOCK.productName}
              option={MOCK.option}
              amount={MOCK.total}
              nameTrailing={<OrderStatusBadge status={order.status} className="shrink-0" />}
            />
          </div>

          {/* 배송이 끝나야 반품·교환을 접수할 수 있다(mypa_161_배송완료). 배송 전에는
              주문 취소가 맞는 길이라 이 자리에 두지 않는다 */}
          {order.status === "delivered" && <ClaimActions />}
        </section>

        <DetailSection
          title="결제상세"
          titleTrailing={MOCK.paidAt}
          className="rounded-xl bg-card px-3 py-4"
        >
          <PaymentDetail
            total={MOCK.total}
            itemPrice={MOCK.itemPrice}
            shippingFee={MOCK.shippingFee}
            payMethod={MOCK.card}
          />
        </DetailSection>

        <DetailSection title="배송지 정보" className="rounded-xl bg-card px-3 py-4">
          <DeliveryDetail
            receiver={MOCK.receiver}
            phone={MOCK.phone}
            address={MOCK.address}
            request={MOCK.request}
          />
        </DetailSection>
      </main>
    </div>
  );
}
