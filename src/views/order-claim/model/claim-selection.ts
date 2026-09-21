// 신청 화면이 들고 있는 선택 상태와 그것을 요청 모양으로 옮기는 계산.
//
// 화면에서 떼어 두면 눌러 보지 않고도 규칙을 시험할 수 있다. 상태는 `orderItemId → 수량`
// 한 장이고, **키가 없으면 고르지 않은 것**이다. 수량 0을 고른 것으로 세지 않는다.

import type { CreateClaimItem, OrderDetailItem, OrderItemClaim } from "@/entities/order";

/** 고른 상품과 수량. 키가 없으면 고르지 않았다 */
export type ClaimSelection = Record<number, number>;

/**
 * 아직 끝나지 않은 신청인가.
 *
 * 백엔드 `ClaimStatus.terminalStates()`가 `COMPLETED`·`REJECTED` 둘을 끝으로 본다.
 * 나머지(`REQUESTED`·`COLLECTING`·`INSPECTING`)는 진행 중이다.
 */
export function isActiveClaim(claim: OrderItemClaim): boolean {
  return claim.claimStatus !== "COMPLETED" && claim.claimStatus !== "REJECTED";
}

/**
 * 이미 신청이 걸린 상품인가.
 *
 * **서버가 품목 단위로 막는다.** `OrderItem.activeClaimStatus`가 비어 있을 때만 새 신청을
 * 받고, 아니면 `ORDER_409_CLAIM_ALREADY_IN_PROGRESS`로 **요청 전체**를 거절한다. 상품
 * 하나 때문에 나머지까지 되돌아가므로 고르지 못하게 먼저 막는다.
 */
export function hasActiveClaim(item: OrderDetailItem): boolean {
  return item.claims.some(isActiveClaim);
}

/** 신청할 수 있는 상품만 남긴다 */
export function claimableItems(items: OrderDetailItem[]): OrderDetailItem[] {
  return items.filter((item) => !hasActiveClaim(item));
}

/** 고른 것을 켜고 끈다. 켤 때 수량은 1로 시작한다 */
export function toggleSelection(selection: ClaimSelection, orderItemId: number): ClaimSelection {
  const { [orderItemId]: picked, ...rest } = selection;
  return picked === undefined ? { ...selection, [orderItemId]: 1 } : rest;
}

/**
 * 요청 본문의 `items`로 옮긴다.
 *
 * 서버가 `@NotEmpty`와 품목 중복 금지를 걸지만, 키가 하나인 표에서 옮기므로 중복은 생기지
 * 않는다. 빈 배열은 화면이 신청 버튼을 잠가 막는다.
 */
export function toRequestItems(selection: ClaimSelection): CreateClaimItem[] {
  return Object.entries(selection).map(([orderItemId, quantity]) => ({
    orderItemId: Number(orderItemId),
    quantity,
  }));
}
