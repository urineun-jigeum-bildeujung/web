// 결제일 묶음 안의 주문 한 건. 결제 시각·주문 상세 링크 아래로 상품마다 상태 뱃지·상품 줄·행동 버튼이 붙는다.
// UI 시안 기준(mypa_061 3324:36866 한 건 · 3324:36871 상품 하나 · 3324:36887 action_button)이다 (#405).
//
// **상태와 행동은 상품마다 그리지만 서버에서는 주문 단위다.** 목록 응답에 상품별 상태가 없고
// 취소·구매 확정도 주문에 걸려 있어, 같은 주문의 상품은 늘 같은 뱃지를 달고 어느 줄에서
// "주문 취소"를 눌러도 주문 전체가 취소된다. PD팀은 **상품마다 따로 취소하는 것이 맞다**고
// 답했다(2026-09-23). 서버에 상품 단위 취소가 없어 백엔드 요청 대상이다.

import Link from "next/link";

import {
  OrderProductRow,
  OrderStatusBadge,
  toOrderStatus,
  type OrderSummary,
} from "@/entities/order";
import { formatDisplayMonthDayTime } from "@/shared/lib/date/display-date";
import { Button } from "@/shared/ui/button";

/** 시안의 목록 행동 버튼. 40px에 굵은 14px, 연한 회색 바탕이다. 하나면 가득, 둘이면 나눈다 */
const ACTION_CLASS = "h-10 flex-1 rounded-lg text-label-bold-14";

type OrderEntryProps = {
  order: OrderSummary;
  onCancel: (orderId: number) => void;
  onConfirm: (orderId: number) => void;
  onTrack: () => void;
  onReorder: () => void;
};

export function OrderEntry({ order, onCancel, onConfirm, onTrack, onReorder }: OrderEntryProps) {
  const status = toOrderStatus(order.orderStatus);
  // **목록에는 결제 시각이 없어 주문 시각을 쓴다.** 결제는 주문을 만든 직후라 같다.
  // 결제 시각(`payment.paidAt`)은 상세 응답에만 온다
  const paidTime = formatDisplayMonthDayTime(order.orderedAt);

  return (
    <article className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-body-medium-14 text-text-body-secondary">
        {paidTime && <span>{paidTime}</span>}
        <Link href={`/mypage/orders/${order.orderId}`} className="ml-auto underline">
          주문 상세
        </Link>
      </div>

      <ul className="flex flex-col gap-4">
        {order.items.map((item) => (
          <li key={item.orderItemId} className="flex flex-col gap-2">
            {/* 모르는 상태 값이면 뱃지를 붙이지 않는다. 명세에 없는 값을 추측으로 옮기면
                엉뚱한 단계가 확정처럼 보인다 (entities/order/model/order-status.ts) */}
            {status && <OrderStatusBadge status={status} className="self-start" />}

            {/* 목록 응답에 상품별 금액이 없어 금액 줄을 비운다. 받으면 채운다 (#405) */}
            <OrderProductRow
              name={item.productName}
              quantity={item.quantity}
              imageUrl={item.thumbnailUrl}
            />

            <div className="flex gap-2">
              {/* 배송이 시작되기 전까지만 취소할 수 있다. 백엔드 전이 규칙도 `PAID`·`PREPARING`에서만
                  취소를 허용하는데, 화면은 그 둘을 한 단계로 묶는다 */}
              {status === "preparing" && (
                <Button
                  variant="secondary"
                  className={ACTION_CLASS}
                  onClick={() => onCancel(order.orderId)}
                >
                  주문 취소
                </Button>
              )}
              {/* 시안은 활성이지만 택배사 연동 전이라 갈 곳이 없다. 준비중임을 알린다 */}
              {status === "shipping" && (
                <Button variant="secondary" className={ACTION_CLASS} onClick={onTrack}>
                  배송 위치 보기
                </Button>
              )}
              {/* 처음 정리본에서 빠졌다가 PD팀이 누락이라 답하고 다시 넣었다(2026-09-23).
                  문구의 띄어쓰기도 시안 그대로다 */}
              {status === "delivered" && (
                <Button
                  variant="secondary"
                  className={ACTION_CLASS}
                  onClick={() => onConfirm(order.orderId)}
                >
                  구매확정 하기
                </Button>
              )}
              <Button variant="secondary" className={ACTION_CLASS} onClick={onReorder}>
                장바구니 담기
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
