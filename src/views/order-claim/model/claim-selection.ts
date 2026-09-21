// 신청 화면이 들고 있는 선택 상태와 그것을 요청 모양으로 옮기는 계산.
//
// 화면에서 떼어 두면 눌러 보지 않고도 규칙을 시험할 수 있다. 상태는 `orderItemId → 수량`
// 한 장이고, **키가 없으면 고르지 않은 것**이다. 수량 0을 고른 것으로 세지 않는다.
//
// **신청이 걸렸는지 판정하는 것은 여기 없다.** 주문 상세도 같은 판정을 쓰게 되면서
// `entities/order`로 내려갔다 (#334).

import type { CreateClaimItem } from "@/entities/order";

/** 고른 상품과 수량. 키가 없으면 고르지 않았다 */
export type ClaimSelection = Record<number, number>;

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
