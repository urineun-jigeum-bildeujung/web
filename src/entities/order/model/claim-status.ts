// 상품에 걸린 반품·교환 신청을 읽는다. 주문 상세와 신청 화면이 같은 판정을 쓴다.
//
// **값은 백엔드 enum에서 옮겼다** (`order-service`의 `domain/claim`). 문서에 없어 소스를 봤다.
//
// ```
// ClaimType    CANCEL · RETURN · EXCHANGE
// ClaimStatus  REQUESTED → COLLECTING → INSPECTING → COMPLETED
//              어느 단계에서든 REJECTED로 끝날 수 있다
// ```
//
// **MVP에서 실제로 오는 것은 `REQUESTED` 하나다.** 백엔드 회신(2026-09-21) — "현재 관리자 권한
// 개발이 생략되어서 COMPLETED 등으로 넘어갈 일이 없을 것 같습니다". 시연에 필요하면 DB에서
// 직접 바꾼다고 했다.
//
// **"반품 접수" 같은 문구 표를 다시 둔다.** 주문 상세에서 신청 상태를 뱃지로 보였다가(#334)
// 2026-09-23 시안에 그 자리가 없어 뺐는데, QA가 주문 상세에 교환·반품 세부 상태가 보여야 한다고
// 해 되살렸다(QA No.287, #655).

import type { OrderDetailItem, OrderItemClaim } from "../api/orders";

/**
 * 아직 끝나지 않은 신청인가.
 *
 * 백엔드 `ClaimStatus.terminalStates()`가 `COMPLETED`·`REJECTED` 둘을 끝으로 본다.
 * 나머지 셋은 진행 중이다.
 */
export function isActiveClaim(claim: OrderItemClaim): boolean {
  return claim.claimStatus !== "COMPLETED" && claim.claimStatus !== "REJECTED";
}

/**
 * 이미 신청이 걸린 상품인가.
 *
 * **서버가 품목 단위로 막는다.** `OrderItem.activeClaimStatus`가 비어 있을 때만 새 신청을
 * 받고, 아니면 `ORDER_409_CLAIM_ALREADY_IN_PROGRESS`로 **요청 전체**를 거절한다.
 */
export function hasActiveClaim(item: OrderDetailItem): boolean {
  return item.claims.some(isActiveClaim);
}

/**
 * 새로 신청할 수 있는 상품만 남긴다.
 *
 * **남은 수량이 0이면 뺀다.** 전부 취소·반품된 줄은 고를 수 있는 수량이 없어, 남겨 두면
 * 수량 1로 신청했다가 서버가 거절한다 (#374).
 */
export function claimableItems(items: OrderDetailItem[]): OrderDetailItem[] {
  return items.filter((item) => !hasActiveClaim(item) && item.effectiveQuantity > 0);
}

/** 반품·교환을 받는 기간. 기능명세서와 서버 `Order.isClaimableForReturn`이 같은 값이다 */
const CLAIM_DAYS = 7;

/**
 * 아직 반품·교환을 받는 기간인가.
 *
 * **배송완료 시각이 없으면 받지 않는다.** 배송이 끝나지 않았다는 뜻이다.
 *
 * 절대 시각으로 견준다. 표시와 달리 이 판정에는 시간대를 맞출 것이 없다 — 서버가 오프셋을
 * 붙여 주므로 `new Date`가 같은 순간으로 읽는다.
 */
export function isWithinClaimPeriod(deliveredAt: string | null): boolean {
  if (!deliveredAt) {
    return false;
  }
  const delivered = new Date(deliveredAt);
  if (Number.isNaN(delivered.getTime())) {
    return false;
  }
  return delivered.getTime() + CLAIM_DAYS * 24 * 60 * 60 * 1000 > Date.now();
}

const CLAIM_TYPE_LABEL: Record<string, string> = {
  CANCEL: "취소",
  RETURN: "반품",
  EXCHANGE: "교환",
};

const CLAIM_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "접수",
  COLLECTING: "수거 중",
  INSPECTING: "검수 중",
  COMPLETED: "완료",
  REJECTED: "거절",
};

/**
 * 신청 한 건을 "반품 접수"처럼 종류와 진행 상태로 읽는다. 모르는 값이 섞이면 `null`이다.
 *
 * 주문 상세가 상품마다 붙인다(QA No.287, #655). 걷어 냈던 문구 표(#334)를 다시 둔다 — 대조는 백엔드
 * enum 그대로다(위 머리 주석).
 */
export function claimLabel(claim: OrderItemClaim): string | null {
  const type = Object.hasOwn(CLAIM_TYPE_LABEL, claim.claimType)
    ? CLAIM_TYPE_LABEL[claim.claimType]
    : undefined;
  const status = Object.hasOwn(CLAIM_STATUS_LABEL, claim.claimStatus)
    ? CLAIM_STATUS_LABEL[claim.claimStatus]
    : undefined;
  return type && status ? `${type} ${status}` : null;
}

/**
 * 가장 나중에 접수한 신청. 없으면 `null`이다.
 *
 * **글자가 아니라 시각으로 견준다.** 접수 시각은 오프셋이 붙은 ISO 8601이라, 오프셋이 다르면
 * 글자 순서와 실제 순서가 어긋난다 — `11:00+09:00`이 `03:00Z`보다 이르다 (#655 리뷰).
 */
export function latestClaim(item: OrderDetailItem): OrderItemClaim | null {
  return item.claims.reduce<OrderItemClaim | null>(
    (latest, claim) =>
      !latest || Date.parse(claim.requestedAt) > Date.parse(latest.requestedAt) ? claim : latest,
    null,
  );
}
