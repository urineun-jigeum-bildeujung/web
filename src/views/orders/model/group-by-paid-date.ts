// 주문 목록을 결제일(한국 날짜)로 묶는다. 같은 날 결제한 주문이 한 머리 아래 모인다.
//
// PD 메모(mypa_061 레이아웃 변경 참고, 3326:33463) — "주문 내역은 결제일 기준으로 폴더링됩니다.
// 최상위는 결제일 그 다음은 결제 시간으로 나뉘어집니다" (#405).
//
// **목록에는 결제 시각이 없어 주문 시각으로 묶는다.** 결제는 주문을 만든 직후라 날짜가 같다.

import type { OrderSummary } from "@/entities/order";
import { toDisplayDayKey } from "@/shared/lib/date/display-date";

export type PaidDateGroup = {
  /** 한국 기준 하루 키. 읽을 수 없는 시각이면 그 주문만 따로 묶이는 자리 키다 */
  key: string;
  /** 머리에 적을 날짜(`26.09.03`). 읽을 수 없으면 `null`이라 머리를 비운다 */
  day: string | null;
  orders: OrderSummary[];
};

/**
 * 이어서 오는 같은 날 주문을 한 묶음으로 만든다.
 *
 * **붙어 있는 것만 묶는다.** 서버가 최신순으로 주고 다음 쪽도 그 뒤를 잇기 때문에 같은 날
 * 주문은 늘 붙어 온다. 떨어진 것까지 찾아 모으면 순서를 서버와 다르게 바꾸게 된다.
 */
export function groupByPaidDate(orders: OrderSummary[]): PaidDateGroup[] {
  const groups: PaidDateGroup[] = [];

  for (const order of orders) {
    const day = toDisplayDayKey(order.orderedAt);
    const last = groups.at(-1);

    if (day && last?.day === day) {
      last.orders.push(order);
      continue;
    }
    groups.push({ key: day ?? `order-${order.orderId}`, day, orders: [order] });
  }

  return groups;
}
