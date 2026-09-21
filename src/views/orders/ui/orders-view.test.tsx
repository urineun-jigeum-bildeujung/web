// 주문·배송 확인 테스트. 서버가 준 주문을 그리는지, 상태별 행동이 맞는지,
// 모르는 상태 값이 왔을 때 조용히 엉뚱한 뱃지를 붙이지 않는지 본다.
//
// **목이 서버처럼 상태를 든다.** 구매 확정·주문 취소는 끝난 뒤 목록을 다시 조회해 맞추므로,
// 목이 늘 같은 값을 돌려주면 확정한 주문이 그대로 되살아나 통과 여부가 뒤집힌다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

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

test("서버가 준 주문을 상품명과 주문 일자로 보여준다", async () => {
  render(<OrdersView />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("테스트 상품 1")).toBeDefined();
  // ISO로 오는 값을 시안 형식(yy.MM.dd)으로 옮긴다
  expect(screen.getAllByText("주문 일자 26.09.15").length).toBeGreaterThan(0);
});

test("결제완료 주문에는 주문 취소가, 배송완료에는 구매 확정하기가 나온다", async () => {
  render(<OrdersView />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("button", { name: "주문 취소" })).toBeDefined();
  expect(screen.getByRole("button", { name: "구매 확정하기" })).toBeDefined();
});

test("구매 확정은 서버를 부르고 끝난 뒤 목록에서 그 버튼이 사라진다", async () => {
  render(<OrdersView />, { wrapper: createQueryWrapper() });

  fireEvent.click(await screen.findByRole("button", { name: "구매 확정하기" }));
  expect(screen.getByText("무사히 잘 도착했나요?")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "확정하기" }));

  // 로컬 배열만 바꾸면 새로고침에 되돌아온다. 서버를 부른 뒤 다시 조회해 맞춘다
  await waitFor(() => expect(confirmOrder).toHaveBeenCalledWith(2));
  await waitFor(() => expect(screen.queryByRole("button", { name: "구매 확정하기" })).toBeNull());
});

test("주문을 취소하면 서버를 부르고 그 주문이 목록에서 사라진다", async () => {
  render(<OrdersView />, { wrapper: createQueryWrapper() });

  fireEvent.click(await screen.findByRole("button", { name: "주문 취소" }));
  fireEvent.click(screen.getByRole("button", { name: "주문 취소하기" }));

  await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(1));
  await waitFor(() => expect(screen.queryByText("테스트 상품 1")).toBeNull());
});

test("자세히 보기는 그 주문의 상세로 간다", async () => {
  render(<OrdersView />, { wrapper: createQueryWrapper() });

  const link = (await screen.findAllByRole("link", { name: "자세히 보기" }))[0];
  expect(link.getAttribute("href")).toBe("/mypage/orders/1");
});

// 명세에 배송준비중·배송중에 해당하는 값이 없다. 추측으로 매핑하면 그 주문만 조용히
// 엉뚱한 단계로 보인다. 모르는 값은 뱃지도 행동 버튼도 내보내지 않는다 (#284).
test("명세에 없는 상태 값이 오면 뱃지와 행동 버튼을 내보내지 않는다", async () => {
  served = [makeOrder(9, "SOMETHING_NEW")];
  render(<OrdersView />, { wrapper: createQueryWrapper() });

  // 주문 자체는 보인다 — 상태를 모른다고 주문을 감추면 산 것이 사라진다
  expect(await screen.findByText("테스트 상품 9")).toBeDefined();
  expect(screen.queryByText("배송준비중")).toBeNull();
  expect(screen.queryByText("결제완료")).toBeNull();
  expect(screen.queryByRole("button", { name: "주문 취소" })).toBeNull();
  expect(screen.queryByRole("button", { name: "구매 확정하기" })).toBeNull();
  // 상세로 가는 길은 남는다
  expect(screen.getByRole("link", { name: "자세히 보기" })).toBeDefined();
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

  render(<OrdersView />, { wrapper: createQueryWrapper() });
  fireEvent.click(await screen.findByRole("button", { name: "구매 확정하기" }));
  fireEvent.click(screen.getByRole("button", { name: "확정하기" }));

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "나중에 할게요" }).hasAttribute("disabled")).toBe(
      true,
    ),
  );

  release?.();
});

test("주문이 없으면 빈 상태를 안내한다", async () => {
  served = [];
  render(<OrdersView />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("아직 주문한 내역이 없어요")).toBeDefined();
});

test("조회가 실패하면 토스트 대신 화면에서 알린다", async () => {
  getOrders.mockRejectedValue(new Error("network down"));
  render(<OrdersView />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("alert")).toBeDefined();
});

// 상품이 여럿인 주문을 한 줄로 접으면 무엇을 샀는지 알 수 없다. 남은 수를 함께 알린다.
test("상품이 여럿이면 첫 상품과 남은 건수를 함께 보인다", async () => {
  served = [
    makeOrder(5, "PAID", {
      items: [
        { orderItemId: 50, thumbnailUrl: null, productName: "사료", quantity: 2 },
        { orderItemId: 51, thumbnailUrl: null, productName: "간식", quantity: 1 },
      ],
    }),
  ];
  render(<OrdersView />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("사료")).toBeDefined();
  expect(screen.getByText("2개 외 1건")).toBeDefined();
});
