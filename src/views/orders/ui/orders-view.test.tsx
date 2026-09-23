// 주문·배송 확인 테스트. 서버가 준 주문을 그리는지, 상태별 행동이 맞는지,
// 모르는 상태 값이 왔을 때 조용히 엉뚱한 뱃지를 붙이지 않는지 본다.
// 구성은 2026-09-23 시안(mypa_061, #405)을 따른다 — 탭 둘, 결제일 묶음 아래 결제 시각, 상품마다 뱃지·버튼.
//
// **목이 서버처럼 상태를 든다.** 구매 확정은 끝난 뒤 목록을 다시 조회해 맞추므로,
// 목이 늘 같은 값을 돌려주면 확정한 주문이 그대로 되살아나 통과 여부가 뒤집힌다.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { getOrders, confirmOrder, addCartItem, showSnackbar } = vi.hoisted(() => ({
  getOrders: vi.fn(),
  confirmOrder: vi.fn(),
  addCartItem: vi.fn(),
  showSnackbar: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

vi.mock("@/entities/order/api/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order/api/orders")>()),
  getOrders,
  confirmOrder,
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

import type { OrderListResponse, OrderSummary } from "@/entities/order";
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

/** 탭을 URL(`?tab=`)에 담아 nuqs 어댑터가 있어야 그려진다 */
function renderView(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <OrdersView />
    </NuqsTestingAdapter>,
    { wrapper: createQueryWrapper() },
  );
}

/** 서버가 든 주문. 확정이 여기에 반영돼야 다시 조회했을 때 달라진다 */
let served: OrderSummary[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  served = [makeOrder(1, "PAID"), makeOrder(2, "DELIVERED"), makeOrder(3, "CONFIRMED")];
  getOrders.mockImplementation(async () => respond(served));
  confirmOrder.mockImplementation(async (orderId: number) => {
    served = served.map((o) => (o.orderId === orderId ? { ...o, orderStatus: "CONFIRMED" } : o));
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
  expect(screen.getAllByRole("link", { name: "주문 상세" })).toHaveLength(3);
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
// **취소는 목록에 없다.** 서버가 주문 전체만 취소해 PD가 주문 상세 맨 아래로 옮겼다 (#410)
test("결제 직후 주문에는 취소 버튼이 없고, 배송완료에는 구매확정 하기가 나온다", async () => {
  renderView();

  expect(await screen.findByRole("button", { name: "구매확정 하기" })).toBeDefined();
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

test("구매 확정은 서버를 부르고 끝난 뒤 목록에서 그 버튼이 사라진다", async () => {
  renderView();

  fireEvent.click(await screen.findByRole("button", { name: "구매확정 하기" }));
  const sheet = screen.getByRole("dialog", { name: "무사히 잘 도착했나요?" });
  // 무엇을 확정하는지 보여 준다. 금액도 목록과 같이 그 줄에 낸 값이다 (#418)
  expect(sheet.textContent).toContain("테스트 상품 2");
  expect(sheet.textContent).toContain("2,500");
  fireEvent.click(screen.getByRole("button", { name: "확정하기" }));

  // 로컬 배열만 바꾸면 새로고침에 되돌아온다. 서버를 부른 뒤 다시 조회해 맞춘다
  await waitFor(() => expect(confirmOrder).toHaveBeenCalledWith(2));
  await waitFor(() => expect(screen.queryByRole("button", { name: "구매확정 하기" })).toBeNull());
});

// 옛 시안의 "자세히 보기" 버튼 자리를 주문 머리의 링크가 대신한다
test("주문 상세는 그 주문의 상세로 간다", async () => {
  renderView();

  const link = (await screen.findAllByRole("link", { name: "주문 상세" }))[0];
  expect(link.getAttribute("href")).toBe("/mypage/orders/1");
  expect(screen.queryByRole("link", { name: "자세히 보기" })).toBeNull();
});

// 명세에 배송준비중·배송중에 해당하는 값이 없다. 추측으로 매핑하면 그 주문만 조용히
// 엉뚱한 단계로 보인다. 모르는 값은 뱃지도 행동 버튼도 내보내지 않는다 (#284).
test("명세에 없는 상태 값이 오면 뱃지와 행동 버튼을 내보내지 않는다", async () => {
  served = [makeOrder(9, "SOMETHING_NEW")];
  renderView();

  // 주문 자체는 보인다 — 상태를 모른다고 주문을 감추면 산 것이 사라진다
  expect(await screen.findByText("테스트 상품 9")).toBeDefined();
  expect(screen.queryByText("배송준비중")).toBeNull();
  expect(screen.queryByRole("button", { name: "구매확정 하기" })).toBeNull();
  // 상세로 가는 길은 남는다
  expect(screen.getByRole("link", { name: "주문 상세" })).toBeDefined();
});

// 보내는 중에 시트가 닫히면 어느 주문을 확정하는지 잃은 채 요청만 남는다 (#293 리뷰)
test("구매를 확정하는 동안에는 시트를 닫을 수 없다", async () => {
  let release: (() => void) | undefined;
  confirmOrder.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        release = () => resolve();
      }),
  );

  renderView();
  fireEvent.click(await screen.findByRole("button", { name: "구매확정 하기" }));
  fireEvent.click(screen.getByRole("button", { name: "확정하기" }));

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "나중에 할게요" }).hasAttribute("disabled")).toBe(
      true,
    ),
  );

  // **Escape로도 닫히지 않는다.** 버튼을 잠그는 것만으로는 모자라다 — 바깥을 누르거나
  // Escape를 치는 길이 남아 있고, 그리로 닫히면 어느 주문을 확정하는지 잃는다
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.getByText("무사히 잘 도착했나요?")).toBeDefined();

  release?.();
});

// 한 번에 오는 것은 기본 열 건이다. 첫 쪽만 그리면 열한 번째 주문부터 볼 길이 없다 (#288).
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

// 탭 화면 시안이 완성본에 없고 신청 목록 API도 없다. 그 탭에 있는 동안 주문 목록을 부르지 않는다
test("취소·반품·교환 탭은 준비 중이라고 알린다", async () => {
  renderView("?tab=claims");

  expect(screen.getByRole("tab", { name: "취소·반품·교환" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(await screen.findByText("취소·반품·교환 내역 준비 중")).toBeDefined();
  expect(getOrders).not.toHaveBeenCalled();
});
