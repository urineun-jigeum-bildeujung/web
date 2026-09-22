// 주문 목록 조회를 가로채 정해진 답을 준다.
//
// **목록이 실제 API를 부르게 되면서 세울 것이 생겼다(#284).** 세우지 않으면 백엔드가 없는
// CI에서 404가 나고, 브라우저가 그 실패를 콘솔 오류로 찍어 화면 스모크가 깨진다.
// 무엇을 그리는지는 단위 테스트(`orders-view.test.tsx`)가 본다.

import type { Page } from "@playwright/test";

/** 상태별 행동 버튼이 한 번씩 서도록 고른 세 건 */
const ORDERS = [
  {
    orderId: 1,
    orderNumber: "ORD-E2E-0001",
    orderedAt: "2026-09-15T03:00:00.000Z",
    orderStatus: "PAID",
    totalAmount: 12345,
    items: [{ orderItemId: 10, thumbnailUrl: null, productName: "테스트 사료", quantity: 1 }],
  },
  {
    orderId: 2,
    orderNumber: "ORD-E2E-0002",
    orderedAt: "2026-09-14T03:00:00.000Z",
    orderStatus: "DELIVERED",
    totalAmount: 23456,
    items: [{ orderItemId: 20, thumbnailUrl: null, productName: "테스트 간식", quantity: 2 }],
  },
  {
    orderId: 3,
    orderNumber: "ORD-E2E-0003",
    orderedAt: "2026-09-13T03:00:00.000Z",
    orderStatus: "CONFIRMED",
    totalAmount: 34567,
    items: [{ orderItemId: 30, thumbnailUrl: null, productName: "테스트 영양제", quantity: 1 }],
  },
];

/**
 * 배송완료 시각. **오늘에서 거슬러 잡는다.**
 *
 * 반품·교환은 배송완료 뒤 7일까지만 받으므로(`Order.isClaimable`), 고정 날짜로 박아 두면
 * 그날이 지나는 순간 CI가 저절로 깨진다 (#377).
 */
export const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * 주문 상세. 목록보다 배송지·결제가 더 온다 (#288).
 *
 * **모양을 `OrderDetailResponse`와 같이 맞춰 둔다.** 목이 옛 규격을 고정하면 초록불인 채로
 * 실서버에서 깨진다. `deliveredAt`과 수량 셋이 `sever#117`로 생겼다 (#374).
 */
const DETAIL = {
  orderId: 1,
  orderNumber: "ORD-E2E-0001",
  orderStatus: "DELIVERED",
  deliveredAt: daysAgo(1),
  productAmount: 9345,
  totalAmount: 12345,
  items: [
    {
      orderItemId: 10,
      thumbnailUrl: null,
      productName: "테스트 사료",
      quantity: 2,
      unitPrice: 9345,
      itemStatus: "PAID",
      cancelledQuantity: 0,
      returnedQuantity: 0,
      effectiveQuantity: 2,
      claims: [],
    },
  ],
  deliveryAddress: {
    receiver: "홍길동",
    receiverPhone: "010-1234-5678",
    zipCode: "06133",
    address: "서울특별시 강남구 테헤란로 123",
    addressDetail: "UI타워 4층 404호",
  },
  deliveryNote: "문 앞에 놓아주세요.",
  payment: { paidAt: "2026-09-15T03:00:00.000Z", method: "토스페이먼츠 결제" },
};

export type OrderDetailStub = typeof DETAIL;

/** 접수한 신청. 서버 `CreateClaimResponse` 그대로다 */
const CLAIM = {
  claimId: 1,
  claimType: "RETURN",
  claimStatus: "REQUESTED",
  requestedAt: daysAgo(0),
};

type StubOptions = {
  /** 상세만 다르게 주고 싶을 때. 7일이 지난 주문을 세우는 데 쓴다 */
  detail?: Partial<OrderDetailStub>;
  /** 접수한 요청 본문을 담아 둔다. 무엇을 보냈는지 보는 테스트가 쓴다 */
  claims?: unknown[];
};

export async function stubOrders(page: Page, options: StubOptions = {}) {
  const detail = { ...DETAIL, ...options.detail };

  // 화면 주소(`/mypage/orders`)까지 잡지 않도록 API 경로를 그대로 적는다
  await page.route("**/api/v1/orders**", (route) => {
    const { pathname } = new URL(route.request().url());

    // 접수는 POST다. 목록·상세와 같은 패턴에 걸리므로 먼저 가른다
    if (/\/orders\/\d+\/claims$/.test(pathname)) {
      options.claims?.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, json: CLAIM });
    }
    // 목록과 상세가 같은 패턴에 걸린다. 끝이 숫자면 상세다
    if (/\/orders\/\d+$/.test(pathname)) {
      return route.fulfill({ json: detail });
    }
    return route.fulfill({ json: { orders: ORDERS, nextCursor: null, hasNext: false } });
  });
}
