// 주문·배송 확인 테스트. 서버가 준 주문을 그리는지, 상태별 행동이 맞는지,
// 모르는 상태 값이 왔을 때 조용히 엉뚱한 뱃지를 붙이지 않는지 본다.
// 구성은 2026-09-23 시안(mypa_061, #405)을 따른다 — 탭 둘, 결제일 묶음 아래 결제 시각, 상품마다 뱃지·버튼.
//
// **두 탭이 한 목록을 나눠 쓴다(#462).** 주문내역 탭은 결제 대기·취소 주문을 거르고,
// 취소·반품·교환 탭은 취소한 주문과 상세의 반품·교환 신청을 모은다.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { getOrders, getOrderDetail, addCartItem, showSnackbar } = vi.hoisted(() => ({
  getOrders: vi.fn(),
  getOrderDetail: vi.fn(),
  addCartItem: vi.fn(),
  showSnackbar: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

vi.mock("@/entities/order/api/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order/api/orders")>()),
  getOrders,
  getOrderDetail,
}));

// 담기는 서버까지 가지 않는다. 무엇을 몇 개 담는지는 인자로 본다
vi.mock("@/entities/cart/api/cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/cart/api/cart")>()),
  addCartItem,
}));

vi.mock("@/shared/ui/snackbar/snackbar", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/ui/snackbar/snackbar")>()),
  showSnackbar,
}));

import type {
  OrderDetail,
  OrderItemClaim,
  OrderListResponse,
  OrderSummary,
} from "@/entities/order";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import { OrdersView } from "./orders-view";

function makeOrder(orderId: number, orderStatus: string, over: Partial<OrderSummary> = {}) {
  return {
    orderId,
    orderNumber: `ORD-TEST-${orderId}`,
    // 명세 Example은 17:49Z라 한국에서는 다음 날로 넘어간다. 어느 시간대에서 돌려도
    // 같은 날로 읽히도록 낮 시각을 쓴다
    orderedAt: "2026-09-15T03:00:00.000Z",
    orderStatus,
    totalAmount: 12345,
    items: [
      {
        orderItemId: orderId * 10,
        productId: orderId * 100,
        thumbnailUrl: null,
        productName: `테스트 상품 ${orderId}`,
        quantity: 1,
        amount: orderId * 1000 + 500,
      },
    ],
    ...over,
  } satisfies OrderSummary;
}

function respond(orders: OrderSummary[]): OrderListResponse {
  return { orders, nextCursor: null, hasNext: false };
}

/** 목록의 `makeOrder`와 짝을 이루는 상세. 결제는 목록의 주문 시각과 같은 때에 끝났다 */
function makeDetail(orderId: number, over: Partial<OrderDetail> = {}): OrderDetail {
  return {
    orderId,
    orderNumber: `ORD-TEST-${orderId}`,
    orderStatus: "DELIVERED",
    deliveredAt: null,
    productAmount: 1000,
    totalAmount: 4000,
    items: [
      {
        orderItemId: orderId * 10,
        thumbnailUrl: null,
        productName: `테스트 상품 ${orderId}`,
        quantity: 1,
        unitPrice: 1000,
        paidUnitPrice: 1000,
        amount: 1000,
        itemStatus: "PAID",
        cancelledQuantity: 0,
        returnedQuantity: 0,
        effectiveQuantity: 1,
        claims: [],
      },
    ],
    deliveryAddress: {
      receiver: "홍길동",
      receiverPhone: "010-1234-5678",
      zipCode: "06133",
      address: "서울특별시 강남구 테헤란로 123",
      addressDetail: "4층",
    },
    deliveryNote: null,
    payment: { paidAt: "2026-09-15T03:00:00.000Z", method: "토스페이먼츠" },
    ...over,
  };
}

/** 그 주문 첫 상품에 신청 하나를 건 상세. 05:00Z는 한국 14:00이다 */
function withClaim(orderId: number, claim: Pick<OrderItemClaim, "claimId" | "claimType">) {
  const detail = makeDetail(orderId);
  detail.items[0].claims = [
    {
      claimStatus: "REQUESTED",
      requestedAt: "2026-09-16T05:00:00.000Z",
      completedAt: null,
      ...claim,
    },
  ];
  return detail;
}

/** 탭을 URL(`?tab=`)에 담아 nuqs 어댑터가 있어야 그려진다 */
function renderView(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <OrdersView />
    </NuqsTestingAdapter>,
    { wrapper: createQueryWrapper() },
  );
}

/** 서버가 든 주문. 테스트마다 바꿔 끼운다 */
let served: OrderSummary[] = [];
/** 서버가 든 상세. 없는 주문을 부르면 서버처럼 실패한다 */
let details: OrderDetail[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  served = [makeOrder(1, "PAID"), makeOrder(2, "DELIVERED"), makeOrder(3, "CONFIRMED")];
  details = [];
  getOrders.mockImplementation(async () => respond(served));
  getOrderDetail.mockImplementation(async (orderId: number) => {
    const detail = details.find((candidate) => candidate.orderId === orderId);
    if (!detail) {
      throw new Error(`상세 없음: ${orderId}`);
    }
    return detail;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// PD 메모 — 최상위는 결제일, 그 다음은 결제 시간으로 나뉜다 (3326:33463)
test("같은 날 결제한 주문은 결제일 하나 아래 결제 시각으로 나뉜다", async () => {
  renderView();

  expect(await screen.findByText("테스트 상품 1")).toBeDefined();
  // ISO로 오는 값을 시안 형식으로 옮긴다. 03:00Z는 한국 12:00이다
  expect(screen.getAllByRole("heading", { name: "결제일 26.09.15" })).toHaveLength(1);
  expect(screen.getAllByText("09.15 12:00")).toHaveLength(3);
  expect(screen.getAllByRole("link", { name: /주문 상세$/ })).toHaveLength(3);
});

// 결제일 사이에만 구분선이 들어간다 (3326:33455)
test("결제일이 다르면 머리를 따로 달고 사이에 구분선을 넣는다", async () => {
  served = [
    makeOrder(1, "PAID", { orderedAt: "2026-09-15T03:00:00.000Z" }),
    makeOrder(2, "PAID", { orderedAt: "2026-09-14T03:00:00.000Z" }),
  ];
  renderView();

  expect(await screen.findByRole("heading", { name: "결제일 26.09.15" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "결제일 26.09.14" })).toBeDefined();
  expect(screen.getAllByRole("separator")).toHaveLength(1);
});

// 결제 직후 주문도 배송준비중으로 보인다. 시안에 "결제완료" 뱃지가 없다 (#297).
// **취소와 구매 확정은 목록에 없다.** 서버가 둘 다 주문 전체에 걸어 PD가 주문 상세 맨 아래로
// 옮겼다 — 취소는 #410, 구매 확정은 #462
test("목록에는 주문 취소도 구매확정도 없다", async () => {
  renderView();

  expect(await screen.findByText("배송완료")).toBeDefined();
  expect(screen.queryByRole("button", { name: /구매확정/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /주문 취소/ })).toBeNull();
  expect(screen.getByText("배송준비중")).toBeDefined();
  expect(screen.queryByText("결제완료")).toBeNull();
  // 장바구니 담기는 상태와 상관없이 상품마다 붙는다
  expect(screen.getAllByRole("button", { name: "장바구니 담기" })).toHaveLength(3);
});

// 목록 응답에 그 줄에 낸 금액이 온다(백엔드 #141). 비워 두던 금액 줄을 채운다 (#418)
test("상품마다 그 줄에 낸 금액을 보인다", async () => {
  renderView();

  expect(await screen.findByText("1,500")).toBeDefined();
  expect(screen.getByText("2,500")).toBeDefined();
});

/**
 * **일반 상품으로, 주문한 수량만큼 담는다.** 목록의 `productId`는 타임딜로 산 줄도 원본 상품
 * id다. 상품 상세의 담기와 같이 끝나면 스낵바로 알린다 (#418).
 */
test("장바구니 담기를 누르면 그 상품을 주문한 수량만큼 담고 알린다", async () => {
  served = [
    makeOrder(1, "DELIVERED", { items: [{ ...makeOrder(1, "PAID").items[0], quantity: 3 }] }),
  ];
  addCartItem.mockResolvedValueOnce(undefined);
  renderView();

  fireEvent.click(await screen.findByRole("button", { name: "장바구니 담기" }));

  await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith("상품이 장바구니에 담겼어요"));
  expect(addCartItem).toHaveBeenCalledWith({ itemType: "NORMAL", itemId: 100 }, 3);
});

// 담는 동안 또 누르면 서버가 같은 줄에 수량을 한 번 더 더한다. 눌렸는지도 보여야 한다 (AGENTS.md 5.8)
test("담는 동안 대기를 보이고, 끝날 때까지 담기 버튼이 모두 잠긴다", async () => {
  let finish: () => void = () => {};
  addCartItem.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)));
  renderView();

  // jsdom은 `invisible`을 모르므로 대기 중에도 버튼 이름에 라벨이 남는다. 이름은 느슨하게 찾는다
  fireEvent.click((await screen.findAllByRole("button", { name: /장바구니 담기/ }))[0]);

  expect(await screen.findByRole("status", { name: "장바구니에 담는 중" })).toBeDefined();
  // 다른 줄도 끝날 때까지 잠긴다
  for (const button of screen.getAllByRole("button", { name: /장바구니 담기/ })) {
    expect(button.hasAttribute("disabled")).toBe(true);
  }

  await act(async () => finish());
  await waitFor(() =>
    expect(screen.queryByRole("status", { name: "장바구니에 담는 중" })).toBeNull(),
  );
});

// 실패 알림은 전역(MutationCache.onError)이 맡는다. 담겼다고 거짓으로 알리면 안 된다
test("담기가 실패하면 담겼다고 알리지 않고 버튼을 되살린다", async () => {
  addCartItem.mockRejectedValueOnce(new Error("재고 없음"));
  renderView();

  fireEvent.click((await screen.findAllByRole("button", { name: "장바구니 담기" }))[0]);

  await waitFor(() => expect(addCartItem).toHaveBeenCalled());
  await waitFor(() =>
    expect(
      screen
        .getAllByRole("button", { name: "장바구니 담기" })
        .every((button) => !button.hasAttribute("disabled")),
    ).toBe(true),
  );
  expect(showSnackbar).not.toHaveBeenCalled();
});

test("배송 중이면 배송 위치 보기가 나오고 누르면 준비 중이라고 알린다", async () => {
  served = [makeOrder(4, "SHIPPING")];
  renderView();

  fireEvent.click(await screen.findByRole("button", { name: "배송 위치 보기" }));
  expect(await screen.findByRole("dialog", { name: "배송 조회 준비 중" })).toBeDefined();
});

// 옛 시안의 "자세히 보기" 버튼 자리를 주문 머리의 링크가 대신한다
test("주문 상세는 그 주문의 상세로 간다", async () => {
  renderView();

  const link = (await screen.findAllByRole("link", { name: /주문 상세$/ }))[0];
  expect(link.getAttribute("href")).toBe("/mypage/orders/1");
  expect(screen.queryByRole("link", { name: /자세히 보기$/ })).toBeNull();
});

// 건마다 "주문 상세"만 있으면 화면 낭독기로 링크만 훑을 때 어느 주문인지 가를 수 없다(#474)
test("주문 상세 링크 이름에 그 주문의 상품이 들어간다", async () => {
  served = [
    makeOrder(1, "PAID"),
    makeOrder(2, "PAID", {
      items: [
        { ...makeOrder(2, "PAID").items[0], orderItemId: 20, productName: "사료" },
        { ...makeOrder(2, "PAID").items[0], orderItemId: 21, productName: "간식" },
      ],
    }),
  ];
  renderView();

  expect(await screen.findByRole("link", { name: "테스트 상품 1 주문 상세" })).toBeDefined();
  expect(screen.getByRole("link", { name: "사료 외 1건 주문 상세" })).toBeDefined();
});

// 명세에 배송준비중·배송중에 해당하는 값이 없다. 추측으로 매핑하면 그 주문만 조용히
// 엉뚱한 단계로 보인다. 모르는 값은 뱃지도 행동 버튼도 내보내지 않는다 (#284).
test("명세에 없는 상태 값이 오면 뱃지와 행동 버튼을 내보내지 않는다", async () => {
  served = [makeOrder(9, "SOMETHING_NEW")];
  renderView();

  // 주문 자체는 보인다 — 상태를 모른다고 주문을 감추면 산 것이 사라진다
  expect(await screen.findByText("테스트 상품 9")).toBeDefined();
  expect(screen.queryByText("배송준비중")).toBeNull();
  expect(screen.queryByRole("button", { name: "배송 위치 보기" })).toBeNull();
  // 상세로 가는 길은 남는다
  expect(screen.getByRole("link", { name: /주문 상세$/ })).toBeDefined();
});

// 한 번에 오는 것은 기본 스무 건이다. 첫 쪽만 그리면 스물한 번째 주문부터 볼 길이 없다 (#288).
test("목록 끝이 보이면 다음 쪽을 이어서 가져온다", async () => {
  const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  // 첫 쪽은 커서를 주고, 그 커서로 부르면 마지막 쪽이 온다
  getOrders.mockImplementation(async ({ cursor }: { cursor?: string | null }) =>
    cursor
      ? { orders: [makeOrder(2, "PAID")], nextCursor: null, hasNext: false }
      : { orders: [makeOrder(1, "PAID")], nextCursor: "CURSOR-1", hasNext: true },
  );

  renderView();
  expect(await screen.findByText("테스트 상품 1")).toBeDefined();

  act(() => {
    for (const callback of callbacks) {
      callback([{ isIntersecting: true }]);
    }
  });

  // 받은 커서를 그대로 실어 보내야 다음 쪽이 온다
  await waitFor(() =>
    expect(getOrders).toHaveBeenLastCalledWith({ size: undefined, cursor: "CURSOR-1" }),
  );
  expect(await screen.findByText("테스트 상품 2")).toBeDefined();
  // 앞 쪽도 그대로 남는다 — 갈아끼우면 스크롤하던 자리가 사라진다
  expect(screen.getByText("테스트 상품 1")).toBeDefined();
});

// 서버가 방금 보낸 커서를 그대로 돌려주면 같은 쪽을 끝없이 부르며 목록이 불어난다 (#294 리뷰)
test("같은 커서가 다시 오면 더 부르지 않는다", async () => {
  const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  // 받은 커서를 다시 실어 보내도 같은 커서를 또 준다
  getOrders.mockImplementation(async () => ({
    orders: [makeOrder(1, "PAID")],
    nextCursor: "SAME",
    hasNext: true,
  }));

  renderView();
  await screen.findByText("테스트 상품 1");

  act(() => {
    for (const callback of callbacks) {
      callback([{ isIntersecting: true }]);
    }
  });

  // 두 번(첫 쪽 + 같은 커서로 한 번)에서 멈춘다
  await waitFor(() => expect(getOrders).toHaveBeenCalledTimes(2));
  act(() => {
    for (const callback of callbacks) {
      callback([{ isIntersecting: true }]);
    }
  });
  await waitFor(() => expect(getOrders).toHaveBeenCalledTimes(2));
});

// 둘째 쪽이 실패했다고 보고 있던 목록까지 사라지면 스크롤하던 자리를 잃는다 (#294 리뷰)
test("다음 쪽 조회가 실패해도 앞 쪽은 남는다", async () => {
  const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  getOrders.mockImplementation(async ({ cursor }: { cursor?: string | null }) => {
    if (cursor) {
      throw new Error("network down");
    }
    return { orders: [makeOrder(1, "PAID")], nextCursor: "CURSOR-1", hasNext: true };
  });

  renderView();
  await screen.findByText("테스트 상품 1");

  act(() => {
    for (const callback of callbacks) {
      callback([{ isIntersecting: true }]);
    }
  });

  expect(await screen.findByRole("button", { name: /다시 시도/ })).toBeDefined();
  // 앞 쪽은 그대로다. 전체 오류 화면으로 덮지 않는다
  expect(screen.getByText("테스트 상품 1")).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();

  // **다시 받는 동안에도 오류 상태가 남아 버튼이 서 있다.** 잠그지 않으면 또 눌러 같은 커서로
  // 요청이 한 번 더 나간다 (#427)
  getOrders.mockImplementation(() => new Promise(() => {}));
  fireEvent.click(screen.getByRole("button", { name: /다시 시도/ }));

  expect(await screen.findByRole("status", { name: "주문을 더 불러오는 중" })).toBeDefined();
  expect(screen.getByRole("button", { name: /다시 시도/ }).hasAttribute("disabled")).toBe(true);
});

test("주문이 없으면 빈 상태를 안내한다", async () => {
  served = [];
  renderView();

  expect(await screen.findByText("아직 주문한 내역이 없어요")).toBeDefined();
});

test("조회가 실패하면 토스트 대신 화면에서 알린다", async () => {
  getOrders.mockRejectedValue(new Error("network down"));
  renderView();

  expect(await screen.findByRole("alert")).toBeDefined();
});

// 2026-09-23 시안부터 주문을 한 줄로 접지 않는다. 상품마다 뱃지와 버튼이 붙는다.
// 상태는 주문 단위라 같은 주문의 상품은 같은 뱃지를 단다
test("상품이 여럿이면 상품마다 뱃지·줄·버튼을 세운다", async () => {
  served = [
    makeOrder(5, "PAID", {
      items: [
        {
          orderItemId: 50,
          productId: 500,
          thumbnailUrl: null,
          productName: "사료",
          quantity: 2,
          amount: 40000,
        },
        {
          orderItemId: 51,
          productId: 510,
          thumbnailUrl: null,
          productName: "간식",
          quantity: 1,
          amount: 9000,
        },
      ],
    }),
  ];
  renderView();

  expect(await screen.findByText("사료")).toBeDefined();
  expect(screen.getByText("간식")).toBeDefined();
  expect(screen.getByText("2개")).toBeDefined();
  expect(screen.getByText("1개")).toBeDefined();
  expect(screen.getAllByText("배송준비중")).toHaveLength(2);
  // 배송준비중 상품에는 "장바구니 담기" 하나만 선다 (#410)
  expect(screen.getAllByRole("button", { name: "장바구니 담기" })).toHaveLength(2);
});

// 결제를 끝내지 않은 주문은 보이지 않고, 취소한 주문은 둘째 탭으로 간다 (2026-09-28 PD 답, #462)
test("결제 대기 주문과 취소한 주문은 주문내역 탭에 세우지 않는다", async () => {
  served = [makeOrder(1, "PAID"), makeOrder(2, "PENDING"), makeOrder(3, "CANCELLED")];
  renderView();

  expect(await screen.findByText("테스트 상품 1")).toBeDefined();
  expect(screen.queryByText("테스트 상품 2")).toBeNull();
  expect(screen.queryByText("테스트 상품 3")).toBeNull();
  // 첫 탭은 목록만 쓴다. 상세를 받을 까닭이 없다
  expect(getOrderDetail).not.toHaveBeenCalled();
});

// 한 쪽이 통째로 걸러지면 목록이 빈다. 다음 쪽이 남았는데 비었다고 하면 뒤의 주문을 못 본다 (#462)
test("한 쪽이 모두 걸러져도 비었다고 하지 않고 다음 쪽을 받는다", async () => {
  const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  getOrders.mockImplementation(async ({ cursor }: { cursor?: string | null }) =>
    cursor
      ? { orders: [makeOrder(2, "PAID")], nextCursor: null, hasNext: false }
      : { orders: [makeOrder(1, "PENDING")], nextCursor: "CURSOR-1", hasNext: true },
  );

  renderView();
  await waitFor(() => expect(callbacks.length).toBeGreaterThan(0));
  expect(screen.queryByText("아직 주문한 내역이 없어요")).toBeNull();

  act(() => {
    for (const callback of callbacks) {
      callback([{ isIntersecting: true }]);
    }
  });

  expect(await screen.findByText("테스트 상품 2")).toBeDefined();
  expect(screen.queryByText("아직 주문한 내역이 없어요")).toBeNull();
});

// 받아 둔 것이 모두 걸러진 채 다음 쪽만 실패했다. 첫 조회 실패처럼 화면을 덮으면 다시 시도와
// 오류 화면이 함께 뜬다 (#462)
test("걸러져 빈 목록에서 다음 쪽이 실패하면 오류 화면 대신 다시 시도를 보인다", async () => {
  const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  getOrders.mockImplementation(async ({ cursor }: { cursor?: string | null }) => {
    if (cursor) {
      throw new Error("network down");
    }
    return { orders: [makeOrder(1, "PENDING")], nextCursor: "CURSOR-1", hasNext: true };
  });

  renderView();
  await waitFor(() => expect(callbacks.length).toBeGreaterThan(0));

  act(() => {
    for (const callback of callbacks) {
      callback([{ isIntersecting: true }]);
    }
  });

  expect(await screen.findByRole("button", { name: /다시 시도/ })).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("취소·반품·교환 탭은 취소·환불·교환 뱃지를 단 건을 최근 것부터 세운다", async () => {
  served = [
    makeOrder(1, "PAID"),
    makeOrder(2, "CANCELLED"),
    makeOrder(4, "DELIVERED"),
    makeOrder(5, "CONFIRMED"),
  ];
  details = [
    makeDetail(2, { orderStatus: "CANCELLED" }),
    withClaim(4, { claimId: 40, claimType: "RETURN" }),
    withClaim(5, { claimId: 50, claimType: "EXCHANGE" }),
  ];
  renderView("?tab=claims");

  expect(await screen.findByText("취소")).toBeDefined();
  // 반품 건은 시안대로 "환불"로 단다
  expect(screen.getByText("환불")).toBeDefined();
  expect(screen.getByText("교환")).toBeDefined();
  expect(screen.getByText("테스트 상품 2")).toBeDefined();
  // 배송 전 주문은 취소하지 않은 한 건이 없어 상세도 받지 않는다
  expect(screen.queryByText("테스트 상품 1")).toBeNull();
  expect(getOrderDetail).not.toHaveBeenCalledWith(1);

  // 반품·교환은 접수일, 취소는 결제일로 묶는다 (2026-09-23 PD 답)
  const headings = screen
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
  expect(headings).toEqual(["접수일 26.09.16", "결제일 26.09.15"]);
  expect(screen.getAllByText("09.16 14:00")).toHaveLength(2);
  expect(screen.getByText("09.15 12:00")).toBeDefined();

  // 자세히 보기는 그 주문의 상세로 간다
  const links = screen.getAllByRole("link", { name: /자세히 보기$/ });
  expect(links.map((link) => link.getAttribute("href")).sort()).toEqual([
    "/mypage/orders/2",
    "/mypage/orders/4",
    "/mypage/orders/5",
  ]);
  // 건마다 같은 이름이면 화면 낭독기로 링크만 훑을 때 가를 수 없다. 뱃지와 상품을 앞에 붙인다(#474)
  expect(screen.getByRole("link", { name: "취소 테스트 상품 2 자세히 보기" })).toBeDefined();
  expect(screen.getByRole("link", { name: "환불 테스트 상품 4 자세히 보기" })).toBeDefined();
});

// 결제 실패·재고 부족으로 서버가 취소한 주문도 CANCELLED다. 사용자가 취소한 것이 아니다 (#462)
test("결제한 적 없는 취소 주문은 둘째 탭에도 세우지 않는다", async () => {
  served = [makeOrder(3, "CANCELLED")];
  details = [makeDetail(3, { orderStatus: "CANCELLED", payment: null })];
  renderView("?tab=claims");

  expect(await screen.findByText("취소·반품·교환 내역이 없어요")).toBeDefined();
  expect(getOrderDetail).toHaveBeenCalledWith(3);
  expect(screen.queryByText("테스트 상품 3")).toBeNull();
});

// 여러 상품을 한 번에 신청하면 같은 신청이 상품마다 붙어 온다. 두 건으로 세면 신청이 둘로 보인다
test("한 신청에 걸린 상품들은 한 건으로 모은다", async () => {
  served = [
    makeOrder(6, "DELIVERED", {
      items: [
        {
          orderItemId: 60,
          productId: 600,
          thumbnailUrl: null,
          productName: "사료",
          quantity: 1,
          amount: 30000,
        },
        {
          orderItemId: 61,
          productId: 610,
          thumbnailUrl: null,
          productName: "간식",
          quantity: 2,
          amount: 9000,
        },
      ],
    }),
  ];
  const claim = {
    claimId: 60,
    claimType: "RETURN",
    claimStatus: "REQUESTED",
    requestedAt: "2026-09-16T05:00:00.000Z",
    completedAt: null,
  } satisfies OrderItemClaim;
  const detail = makeDetail(6);
  detail.items = [
    { ...detail.items[0], orderItemId: 60, productName: "사료", claims: [claim] },
    { ...detail.items[0], orderItemId: 61, productName: "간식", quantity: 2, claims: [claim] },
  ];
  details = [detail];
  renderView("?tab=claims");

  expect(await screen.findByText("사료")).toBeDefined();
  expect(screen.getByText("간식")).toBeDefined();
  expect(screen.getAllByText("환불")).toHaveLength(1);
  // 금액은 목록이 주는 그 줄에 낸 값이다
  expect(screen.getByText("간식").closest("li")?.textContent).toContain("9,000");
});

// 상세 하나를 못 받았는데 조용히 빼면 취소한 주문이 사라진 것처럼 보인다 (#462)
test("상세를 받지 못하면 토스트 대신 화면에서 알리고 비었다고 하지 않는다", async () => {
  served = [makeOrder(2, "CANCELLED")];
  renderView("?tab=claims");

  expect(await screen.findByRole("alert")).toBeDefined();
  expect(screen.getByRole("button", { name: "내역을 불러오지 못했어요. 다시 시도" })).toBeDefined();
  expect(screen.queryByText("취소·반품·교환 내역이 없어요")).toBeNull();
});

// 상세 하나가 실패했다고 보이던 건까지 치우고 탭 전체를 오류로 덮으면 다시 시도할 길도 없다(#474)
test("상세 하나가 실패해도 받은 건은 남기고, 다시 시도는 실패한 상세만 다시 받는다", async () => {
  served = [makeOrder(2, "CANCELLED"), makeOrder(4, "DELIVERED")];
  details = [withClaim(4, { claimId: 40, claimType: "RETURN" })];
  renderView("?tab=claims");

  expect(await screen.findByText("환불")).toBeDefined();
  const retry = await screen.findByRole("button", {
    name: "일부 내역을 불러오지 못했어요. 다시 시도",
  });

  details = [...details, makeDetail(2, { orderStatus: "CANCELLED" })];
  fireEvent.click(retry);

  expect(await screen.findByText("취소")).toBeDefined();
  expect(screen.getByText("환불")).toBeDefined();
  expect(screen.queryByRole("button", { name: /다시 시도/ })).toBeNull();
  // 받아 둔 4번은 다시 부르지 않는다
  expect(getOrderDetail.mock.calls.filter(([orderId]) => orderId === 4)).toHaveLength(1);
});

// 둘째 쪽의 상세 하나가 실패했다고 첫 쪽에서 보던 건까지 사라지면 스크롤하던 자리를 잃는다(#474)
test("둘째 쪽 상세가 실패해도 첫 쪽 건이 남는다", async () => {
  const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  getOrders.mockImplementation(async ({ cursor }: { cursor?: string | null }) =>
    cursor
      ? { orders: [makeOrder(2, "CANCELLED")], nextCursor: null, hasNext: false }
      : { orders: [makeOrder(4, "DELIVERED")], nextCursor: "CURSOR-1", hasNext: true },
  );
  details = [withClaim(4, { claimId: 40, claimType: "RETURN" })];
  renderView("?tab=claims");

  expect(await screen.findByText("환불")).toBeDefined();
  await waitFor(() => expect(callbacks.length).toBeGreaterThan(0));
  act(() => {
    for (const callback of callbacks) {
      callback([{ isIntersecting: true }]);
    }
  });

  expect(
    await screen.findByRole("button", { name: "일부 내역을 불러오지 못했어요. 다시 시도" }),
  ).toBeDefined();
  expect(screen.getByText("환불")).toBeDefined();
  expect(screen.getByText("테스트 상품 4")).toBeDefined();
});

// 건이 적은 계정은 목록 끝 줄이 계속 보여, 기다리지 않으면 쪽마다 상세 요청이 한꺼번에 몰린다(#474)
test("상세를 기다리는 동안은 다음 쪽을 부르지 않는다", async () => {
  const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  getOrders.mockImplementation(async ({ cursor }: { cursor?: string | null }) =>
    cursor
      ? { orders: [], nextCursor: null, hasNext: false }
      : { orders: [makeOrder(4, "DELIVERED")], nextCursor: "CURSOR-1", hasNext: true },
  );
  getOrderDetail.mockImplementation(() => new Promise(() => {}));
  renderView("?tab=claims");

  await waitFor(() => expect(getOrderDetail).toHaveBeenCalledWith(4));
  act(() => {
    for (const callback of callbacks) {
      callback([{ isIntersecting: true }]);
    }
  });

  await act(async () => {});
  expect(getOrders).toHaveBeenCalledTimes(1);
});

// 받아 둔 목록을 배경에서 다시 받다 실패해도, 받아 둔 것으로 빈 상태를 보인다. 막으면 빈 화면이 된다(#474)
test("받아 둔 목록을 다시 받다 실패해도 빈 상태를 그대로 보인다", async () => {
  served = [makeOrder(1, "PENDING")];
  renderView();
  expect(await screen.findByText("아직 주문한 내역이 없어요")).toBeDefined();

  // 창으로 돌아오면 낡은 목록을 다시 받는다. TanStack은 window의 visibilitychange를 듣는다
  getOrders.mockRejectedValue(new Error("network down"));
  act(() => {
    window.dispatchEvent(new Event("visibilitychange"));
  });

  await waitFor(() => expect(getOrders).toHaveBeenCalledTimes(2));
  await act(async () => {});
  expect(screen.getByText("아직 주문한 내역이 없어요")).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("취소·반품·교환 건이 없으면 빈 상태를 안내한다", async () => {
  served = [makeOrder(1, "PAID")];
  renderView("?tab=claims");

  expect(screen.getByRole("tab", { name: "취소·반품·교환" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(await screen.findByText("취소·반품·교환 내역이 없어요")).toBeDefined();
  expect(getOrderDetail).not.toHaveBeenCalled();
});
