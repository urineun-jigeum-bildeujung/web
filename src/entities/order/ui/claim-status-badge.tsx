// 상품에 걸린 반품·교환 신청 상태를 뱃지로 보여준다. 걸린 것이 없으면 아무것도 그리지 않는다.
//
// **시안이 없다.** `mypa_161_배송완료`는 반품하기·교환하기 버튼까지만 그리고 신청한 뒤의
// 상태는 그리지 않는다. 새 모양을 만들지 않고 주문 상태 뱃지와 같은 것을 쓴다 (#334).
//
// 클레임이 아니라 **상품을 받는다.** 어느 신청을 보일지 고르는 규칙(`currentClaim`)까지
// 여기서 끝내야 부르는 쪽이 조건문을 들지 않는다.

import type { OrderDetailItem } from "../api/orders";
import { claimLabel, currentClaim } from "../model/claim-status";

export function ClaimStatusBadge({ item }: { item: OrderDetailItem }) {
  const claim = currentClaim(item);
  const label = claim ? claimLabel(claim) : null;

  // 모르는 값이면 그리지 않는다. 지어내는 것보다 비워 두는 쪽이 낫다
  if (!label) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded-sm bg-surface-tertiary px-2 py-1 text-label-medium-12 text-foreground">
      {label}
    </span>
  );
}
