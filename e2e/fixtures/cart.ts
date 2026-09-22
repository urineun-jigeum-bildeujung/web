// 장바구니를 세운다. 담기가 실제로 서버를 부르게 되면서(#316) 스텁이 없으면 거부되고,
// 그때 시트가 열린 채 남는 것은 **의도된 동작**이다 — 실패한 담기를 성공처럼 닫으면 안 된다.
//
// **조회도 세운다.** 세우지 않으면 장바구니 화면이 빈 상태나 오류로 서서, 고르고 결제로
// 넘어가는 길을 E2E가 한 번도 지나지 않는다 (#379).

import type { Page } from "@playwright/test";

/**
 * 담아 둔 줄.
 *
 * **못 사는 줄을 하나 섞는다.** 그 줄은 고를 수 없어야 하고 `전체선택`의 분모에서도 빠져야
 * 하는데, 살 수 있는 줄만 담으면 그 규칙이 지나가지 않는다.
 */
const ITEMS = [
  {
    itemType: "NORMAL",
    itemId: 1,
    quantity: 1,
    available: true,
    unavailableReason: null,
    productName: "테스트 사료",
    thumbnailUrl: null,
    price: 9345,
    originalPrice: 9345,
    discountRate: 0,
    subtotal: 9345,
    dealEndAt: null,
  },
  {
    itemType: "NORMAL",
    itemId: 2,
    quantity: 2,
    available: true,
    unavailableReason: null,
    productName: "테스트 간식",
    thumbnailUrl: null,
    price: 5000,
    originalPrice: 5000,
    discountRate: 0,
    subtotal: 10000,
    dealEndAt: null,
  },
  {
    itemType: "TIME_DEAL",
    itemId: 3,
    quantity: 1,
    available: false,
    unavailableReason: "DEAL_ENDED",
    productName: "끝난 타임딜 상품",
    thumbnailUrl: null,
    price: null,
    originalPrice: null,
    discountRate: null,
    subtotal: null,
    dealEndAt: "2026-09-20T00:00:00.000Z",
  },
];

const CART = { memberId: 1, items: ITEMS, totalAmount: 19345 };

/** 담기를 성공으로 세운다. 서버는 `201 Created`만 주고 본문이 없다 */
export async function stubAddToCart(page: Page) {
  await page.route("**/api/v1/carts/items", (route) => route.fulfill({ status: 201, body: "" }));
}

type CartStubOptions = {
  /** 나간 수량 변경·빼기 요청을 담아 둔다. 무엇을 보냈는지 보는 테스트가 쓴다 */
  calls?: string[];
};

/**
 * 장바구니 조회와 수량·빼기를 세운다.
 *
 * 수량 변경과 빼기는 본문이 없는 `200`·`204`다. 화면은 낙관적으로 먼저 그리고 `onSettled`에서
 * 다시 조회하므로, 조회가 같은 값을 돌려주면 눌렀던 것이 되돌아간 것처럼 보인다 —
 * 그 되돌림까지가 실제 동작이라 목도 그대로 둔다.
 */
export async function stubCart(page: Page, options: CartStubOptions = {}) {
  await page.route("**/api/v1/carts**", (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (pathname.endsWith("/carts/items")) {
      return route.fulfill({ status: 201, body: "" });
    }
    if (request.method() !== "GET") {
      options.calls?.push(`${request.method()} ${pathname.replace(/^.*\/api\/v1/, "")}`);
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({ json: CART });
  });
}
