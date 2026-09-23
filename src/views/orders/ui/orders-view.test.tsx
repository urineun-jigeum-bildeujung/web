// 주문·배송 확인 테스트. 서버가 준 주문을 그리는지, 상태별 행동이 맞는지,
// 모르는 상태 값이 왔을 때 조용히 엉뚱한 뱃지를 붙이지 않는지 본다.
// 구성은 2026-09-23 시안(mypa_061, #405)을 따른다 — 탭 둘, 결제일 묶음 아래 결제 시각, 상품마다 뱃지·버튼.
//
// **목이 서버처럼 상태를 든다.** 구매 확정·주문 취소는 끝난 뒤 목록을 다시 조회해 맞추므로,
// 목이 늘 같은 값을 돌려주면 확정한 주문이 그대로 되살아나 통과 여부가 뒤집힌다.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { getOrders, confirmOrder, cancelOrder } = vi.hoisted(() => ({
  getOrders: vi.fn(),
  confirmOrder: vi.fn(),
  cancelOrder: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

vi.mock("@/entities/order/api/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order/api/orders")>()),
  getOrders,
  confirmOrder,
  cancelOrder,
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
        thumbnailUrl: null,
        productName: `테스트 상품 ${orderId}`,
        quantity: 1,
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

/** 서버가 든 주문. 확정·취소가 여기에 반영돼야 다시 조회했을 때 달라진다 */
let served: OrderSummary[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  served = [makeOrder(1, "PAID"), makeOrder(2, "DELIVERED"), makeOrder(3, "CONFIRMED")];
  getOrders.mockImplementation(async () => respond(served));
  confirmOrder.mockImplementation(async (orderId: number) => {
    served = served.map((o) => (o.orderId === orderId ? { ...o, orderStatus: "CONFIRMED" } : o));
  });
  cancelOrder.mockImplementation(async (orderId: number) => {
    served = served.filter((o) => o.orderId !== orderId);
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

// 결제 직후 주문도 배송준비중으로 보인다. 시안에 "결제완료" 뱃지가 없다 (#297)
test("결제 직후 주문에는 주문 취소가, 배송완료에는 구매확정 하기가 나온다", async () => {
  renderView();

  expect(await screen.findByRole("button", { name: "주문 취소" })).toBeDefined();
  expect(screen.getByRole("button", { name: "구매확정 하기" })).toBeDefined();
  expect(screen.getByText("배송준비중")).toBeDefined();
  expect(screen.queryByText("결제완료")).toBeNull();
  // 장바구니 담기는 상태와 상관없이 상품마다 붙는다
  expect(screen.getAllByRole("button", { name: "장바구니 담기" })).toHaveLength(3);
});

// 주문 응답에 상품 ID가 없어 아직 담을 수 없다. 누르면 왜 안 되는지 알린다 (#405)
test("장바구니 담기를 누르면 준비 중이라고 알린다", async () => {
  renderView();

  fireEvent.click((await screen.findAllByRole("button", { name: "장바구니 담기" }))[0]);
  expect(await screen.findByRole("dialog", { name: "장바구니 담기 준비 중" })).toBeDefined();
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
  // 무엇을 확정하는지 보여 준다
  expect(sheet.textContent).toContain("테스트 상품 2");
  fireEvent.click(screen.getByRole("button", { name: "확정하기" }));

  // 로컬 배열만 바꾸면 새로고침에 되돌아온다. 서버를 부른 뒤 다시 조회해 맞춘다
  await waitFor(() => expect(confirmOrder).toHaveBeenCalledWith(2));
  await waitFor(() => expect(screen.queryByRole("button", { name: "구매확정 하기" })).toBeNull());
});

test("주문을 취소하면 서버를 부르고 그 주문이 목록에서 사라진다", async () => {
  renderView();

  fireEvent.click(await screen.findByRole("button", { name: "주문 취소" }));
  fireEvent.click(screen.getByRole("button", { name: "주문 취소하기" }));

  await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(1));
  await waitFor(() => expect(screen.queryByText("테스트 상품 1")).toBeNull());
});

// 시안은 되돌릴 수 없는 취소를 빨간 버튼으로 둔다. 확인창 기본 버튼(`AlertDialogAction`)에
// 빨간 바탕을 얹었더니 진한 바탕 클래스가 함께 남아 진한 색으로 그려졌다 (#405)
test("주문 취소 확인 버튼은 빨간 바탕 하나만 쓴다", async () => {
  renderView();

  fireEvent.click(await screen.findByRole("button", { name: "주문 취소" }));
  const confirm = screen.getByRole("button", { name: "주문 취소하기" });
  expect(confirm.className).toContain("bg-destructive");
  expect(confirm.className).not.toContain("bg-primary");
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
  expect(screen.queryByRole("button", { name: "주문 취소" })).toBeNull();
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
// 상태·취소는 주문 단위라 같은 주문의 상품은 같은 뱃지를 달고, 어느 줄의 취소든 주문 전체다
test("상품이 여럿이면 상품마다 뱃지·줄·버튼을 세운다", async () => {
  served = [
    makeOrder(5, "PAID", {
      items: [
        { orderItemId: 50, thumbnailUrl: null, productName: "사료", quantity: 2 },
        { orderItemId: 51, thumbnailUrl: null, productName: "간식", quantity: 1 },
      ],
    }),
  ];
  renderView();

  expect(await screen.findByText("사료")).toBeDefined();
  expect(screen.getByText("간식")).toBeDefined();
  expect(screen.getByText("2개")).toBeDefined();
  expect(screen.getByText("1개")).toBeDefined();
  expect(screen.getAllByText("배송준비중")).toHaveLength(2);
  expect(screen.getAllByRole("button", { name: "주문 취소" })).toHaveLength(2);

  fireEvent.click(screen.getAllByRole("button", { name: "주문 취소" })[1]);
  fireEvent.click(screen.getByRole("button", { name: "주문 취소하기" }));
  await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(5));
});

// 탭 화면 시안이 완성본에 없고 신청 목록 API도 없다. 그 탭에 있는 동안 주문 목록을 부르지 않는다
test("취소·환불·교환 탭은 준비 중이라고 알린다", async () => {
  renderView("?tab=claims");

  expect(screen.getByRole("tab", { name: "취소·환불·교환" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(await screen.findByText("취소·환불·교환 내역 준비 중")).toBeDefined();
  expect(getOrders).not.toHaveBeenCalled();
});
