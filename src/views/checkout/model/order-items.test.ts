// 결제할 줄 고르기 테스트. 쿼리로 받은 것과 살 수 없는 줄을 어떻게 가르는지 본다.
import { describe, expect, it } from "vitest";

import type { CartItem } from "@/entities/cart";

import { pickOrderItems } from "./order-items";

/** 살 수 있는 줄. 내용 필드가 전부 채워져 온다 */
function sellable(itemId: number, itemType: CartItem["itemType"] = "NORMAL"): CartItem {
  return {
    itemType,
    itemId,
    quantity: 1,
    available: true,
    unavailableReason: null,
    productName: `상품 ${itemId}`,
    thumbnailUrl: null,
    price: 1000,
    originalPrice: 1000,
    discountRate: 0,
    subtotal: 1000,
    dealEndAt: null,
  };
}

/** 못 사는 줄. 이름·금액이 전부 `null`로 온다 */
function unavailable(itemId: number): CartItem {
  return {
    ...sellable(itemId),
    available: false,
    unavailableReason: "DEAL_ENDED",
    productName: null,
    price: null,
    originalPrice: null,
    discountRate: null,
    subtotal: null,
  };
}

describe("pickOrderItems", () => {
  it("고른 값이 없으면 살 수 있는 줄 전부를 본다", () => {
    const picked = pickOrderItems([sellable(1), sellable(2)], null);

    expect(picked.map((item) => item.itemId)).toEqual([1, 2]);
  });

  it("살 수 없는 줄은 고른 값과 무관하게 뺀다", () => {
    const picked = pickOrderItems([sellable(1), unavailable(2)], null);

    expect(picked.map((item) => item.itemId)).toEqual([1]);
  });

  it("고른 값이 있으면 그 줄만 남긴다", () => {
    const picked = pickOrderItems([sellable(1), sellable(2), sellable(3)], "NORMAL:1,NORMAL:3");

    expect(picked.map((item) => item.itemId)).toEqual([1, 3]);
  });

  it("종류가 다르면 id가 같아도 다른 줄이다", () => {
    const picked = pickOrderItems([sellable(1, "NORMAL"), sellable(1, "TIME_DEAL")], "TIME_DEAL:1");

    expect(picked).toHaveLength(1);
    expect(picked[0].itemType).toBe("TIME_DEAL");
  });

  // `?items=`는 "아무것도 안 골랐다"에 가깝다. 쿼리 누락과 같이 다루면 장바구니가 통째로 결제된다
  it("빈 문자열은 전체가 아니라 빈 선택이다", () => {
    expect(pickOrderItems([sellable(1), sellable(2)], "")).toEqual([]);
  });

  it("고른 값이 하나도 맞지 않으면 빈 목록이다", () => {
    expect(pickOrderItems([sellable(1)], "NORMAL:9")).toEqual([]);
  });

  it("장바구니를 아직 못 받았으면 빈 목록이다", () => {
    expect(pickOrderItems(undefined, null)).toEqual([]);
  });
});
