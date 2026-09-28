// 취소·반품·교환 탭의 건 만들기 테스트. 어떤 주문이 상세를 받아야 하는지, 결제 없는 취소를
// 빼는지, 한 신청을 한 건으로 모으는지, 이름이 다른 날짜를 한 머리에 섞지 않는지 본다.
import { describe, expect, test } from "vitest";

import type { OrderDetail, OrderItemClaim, OrderSummary } from "@/entities/order";

import { groupClaimEntries, needsClaimDetail, toClaimEntries } from "./claim-entries";

function makeOrder(orderId: number, orderStatus: string): OrderSummary {
  return {
    orderId,
    orderNumber: `ORD-${orderId}`,
    orderedAt: "2026-09-15T03:00:00.000Z",
    orderStatus,
    totalAmount: 4000,
    items: [
      {
        orderItemId: orderId * 10,
        productId: orderId * 100,
        thumbnailUrl: null,
        productName: `상품 ${orderId}`,
        quantity: 1,
        amount: 1000,
      },
    ],
  };
}

function makeDetail(orderId: number, claims: OrderItemClaim[] = []): OrderDetail {
  return {
    orderId,
    orderNumber: `ORD-${orderId}`,
    orderStatus: "DELIVERED",
    deliveredAt: null,
    productAmount: 1000,
    totalAmount: 4000,
    items: [
      {
        orderItemId: orderId * 10,
        thumbnailUrl: null,
        productName: `상품 ${orderId}`,
        quantity: 1,
        unitPrice: 1000,
        itemStatus: "PAID",
        cancelledQuantity: 0,
        returnedQuantity: 0,
        effectiveQuantity: 1,
        claims,
      },
    ],
    deliveryAddress: {
      receiver: "홍길동",
      receiverPhone: "010-1234-5678",
      zipCode: "06133",
      address: "서울",
      addressDetail: "4층",
    },
    deliveryNote: null,
    payment: { paidAt: "2026-09-15T03:00:00.000Z", method: "토스페이먼츠" },
  };
}

function claim(claimId: number, claimType: string, requestedAt: string): OrderItemClaim {
  return { claimId, claimType, claimStatus: "REQUESTED", requestedAt, completedAt: null };
}

describe("needsClaimDetail", () => {
  // 반품·교환은 배송완료에서만 받고 그 뒤로는 확정·환불로만 간다. 배송 전은 취소한 것만 건이다
  test.each([
    ["CANCELLED", true],
    ["DELIVERED", true],
    ["CONFIRMED", true],
    ["PARTIAL_REFUND", true],
    ["REFUNDED", true],
    ["cancelled", true],
    ["PENDING", false],
    ["PAID", false],
    ["PREPARING", false],
    ["SHIPPING", false],
  ])("%s → %s", (status, expected) => {
    expect(needsClaimDetail(makeOrder(1, status))).toBe(expected);
  });
});

describe("toClaimEntries", () => {
  test("결제한 뒤 취소한 주문은 결제일로 취소 건이 된다", () => {
    const entries = toClaimEntries([makeOrder(2, "CANCELLED")], [makeDetail(2)]);

    expect(entries).toEqual([
      {
        key: "cancel-2",
        kind: "cancel",
        orderId: 2,
        date: "2026-09-15T03:00:00.000Z",
        items: makeOrder(2, "CANCELLED").items,
      },
    ]);
  });

  // 결제 실패·재고 부족으로 서버가 취소한 주문도 같은 상태다. 사용자가 취소한 것이 아니다
  test("결제 정보가 없는 취소 주문은 건으로 세우지 않는다", () => {
    const detail = { ...makeDetail(3), payment: null };

    expect(toClaimEntries([makeOrder(3, "CANCELLED")], [detail])).toEqual([]);
  });

  test("상세가 아직 오지 않은 주문은 건너뛴다", () => {
    expect(toClaimEntries([makeOrder(2, "CANCELLED")], [])).toEqual([]);
  });

  test("반품은 return, 교환은 exchange로 접수일을 단다. 모르는 유형은 뺀다", () => {
    const entries = toClaimEntries(
      [makeOrder(4, "DELIVERED")],
      [
        makeDetail(4, [
          claim(40, "RETURN", "2026-09-16T05:00:00.000Z"),
          claim(41, "EXCHANGE", "2026-09-17T05:00:00.000Z"),
          claim(42, "CANCEL", "2026-09-18T05:00:00.000Z"),
        ]),
      ],
    );

    // 최근 건이 위로 온다
    expect(entries.map(({ key, kind, date }) => ({ key, kind, date }))).toEqual([
      { key: "claim-41", kind: "exchange", date: "2026-09-17T05:00:00.000Z" },
      { key: "claim-40", kind: "return", date: "2026-09-16T05:00:00.000Z" },
    ]);
  });

  // 여러 상품을 한 번에 신청하면 같은 claimId가 상품마다 붙어 온다(백엔드 GetOrderDetailService)
  test("한 신청이 여러 상품에 붙어 오면 한 건에 그 상품들을 모은다", () => {
    const order = makeOrder(6, "DELIVERED");
    order.items = [
      { ...order.items[0], orderItemId: 60, productName: "사료" },
      { ...order.items[0], orderItemId: 61, productName: "간식" },
    ];
    const detail = makeDetail(6);
    const shared = claim(60, "RETURN", "2026-09-16T05:00:00.000Z");
    detail.items = [
      { ...detail.items[0], orderItemId: 60, claims: [shared] },
      { ...detail.items[0], orderItemId: 61, claims: [shared] },
    ];

    const entries = toClaimEntries([order], [detail]);

    expect(entries).toHaveLength(1);
    expect(entries[0].items.map((item) => item.productName)).toEqual(["사료", "간식"]);
  });

  test("취소 건과 신청 건이 섞여도 날짜가 늦은 것부터 온다", () => {
    const entries = toClaimEntries(
      [makeOrder(2, "CANCELLED"), makeOrder(4, "DELIVERED")],
      [makeDetail(2), makeDetail(4, [claim(40, "RETURN", "2026-09-16T05:00:00.000Z")])],
    );

    expect(entries.map((entry) => entry.key)).toEqual(["claim-40", "cancel-2"]);
  });
});

describe("groupClaimEntries", () => {
  // 반품·교환은 접수일, 취소는 결제일이라 한 머리 아래 두면 어느 날짜인지 틀리게 읽힌다
  test("같은 날이라도 머리 이름이 다르면 따로 묶는다", () => {
    const entries = toClaimEntries(
      [makeOrder(2, "CANCELLED"), makeOrder(4, "DELIVERED"), makeOrder(5, "DELIVERED")],
      [
        makeDetail(2),
        makeDetail(4, [claim(40, "RETURN", "2026-09-15T05:00:00.000Z")]),
        makeDetail(5, [claim(50, "EXCHANGE", "2026-09-15T04:00:00.000Z")]),
      ],
    );

    const groups = groupClaimEntries(entries);

    expect(groups.map(({ label, day, entries }) => [label, day, entries.length])).toEqual([
      ["접수일", "26.09.15", 2],
      ["결제일", "26.09.15", 1],
    ]);
  });

  test("읽을 수 없는 날짜는 머리를 비운다", () => {
    const [group] = groupClaimEntries([
      { key: "claim-1", kind: "return", orderId: 1, date: "not-a-date", items: [] },
    ]);

    expect(group.day).toBeNull();
  });
});
