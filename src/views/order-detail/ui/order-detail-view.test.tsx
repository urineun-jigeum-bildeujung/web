// 주문 상세 테스트. 서버가 준 주문을 그리는지, 응답에 없어 계산해 만드는 값이 맞는지,
// 배송완료일 때만 반품·교환으로 갈 수 있는지 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { getOrderDetail } = vi.hoisted(() => ({ getOrderDetail: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

vi.mock("@/entities/order/api/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order/api/orders")>()),
  getOrderDetail,
}));

import type { OrderDetail } from "@/entities/order";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import { OrderDetailView } from "./order-detail-view";

/** 명세 Example을 그대로 옮긴 값. 배송비는 없고 38,000 - 35,000이 그 자리다 */
function makeDetail(over: Partial<OrderDetail> = {}): OrderDetail {
  return {
    orderId: 1,
    orderNumber: "ORD-TEST-DETAIL-01",
    orderStatus: "PAID",
    productAmount: 35000,
    totalAmount: 38000,
    items: [
      {
        orderItemId: 2,
        thumbnailUrl: null,
        productName: "테스트 상품 A",
        quantity: 1,
        unitPrice: 35000,
        itemStatus: "PAID",
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
    payment: { paidAt: "2026-09-11T03:00:00.000Z", method: "토스페이먼츠 결제" },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getOrderDetail.mockResolvedValue(makeDetail());
});

test("주문정보·결제상세·배송지 정보를 나눠 보여준다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  for (const title of ["주문정보", "결제상세", "배송지 정보"]) {
    expect(await screen.findByRole("heading", { name: title })).toBeDefined();
  }
});

test("서버가 준 주문번호와 상품을 보여준다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("ORD-TEST-DETAIL-01")).toBeDefined();
  expect(screen.getByText("테스트 상품 A")).toBeDefined();
  // 결제 직후 주문도 배송준비중으로 보인다 (#297)
  expect(screen.getByText("배송준비중")).toBeDefined();
});

// 응답에 배송비 필드가 없다. 결제 금액에서 상품 금액을 빼 만드는 값이라 틀리면 바로 돈이 안 맞는다
test("배송비는 결제 금액에서 상품 금액을 뺀 값이다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("배송비")).toBeDefined();
  expect(screen.getByText("3,000원")).toBeDefined();
  expect(screen.getByText("38,000원")).toBeDefined();
  // 상품 금액은 상품 줄과 결제상세 두 곳에 나온다. 상품이 하나뿐이라 값이 같다
  expect(screen.getAllByText("35,000원")).toHaveLength(2);
});

// 도로명과 상세 주소가 따로 온다. 하나만 그리면 몇 층 몇 호인지 사라진다
test("배송지는 도로명과 상세 주소를 함께 보여준다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("서울특별시 강남구 테헤란로 123 UI타워 4층 404호")).toBeDefined();
  expect(screen.getByText("010-1234-5678")).toBeDefined();
});

// 시안(mypa_161)의 결제상세는 결제금액·상품 옵션·배송비·결제수단 넷뿐이다
test("시안에서 빠진 포인트 할인과 하단 링크를 보여주지 않는다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  await screen.findByText("ORD-TEST-DETAIL-01");
  expect(screen.queryByText("포인트 할인")).toBeNull();
  expect(screen.queryByRole("link", { name: "리뷰 작성" })).toBeNull();
  expect(screen.queryByRole("link", { name: "문의하기" })).toBeNull();
});

// 배송이 끝나야 반품·교환을 접수할 수 있다. 배송 전에는 주문 취소가 맞는 길이다
test("배송완료가 아니면 반품·교환 버튼이 없다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  await screen.findByText("ORD-TEST-DETAIL-01");
  expect(screen.queryByRole("button", { name: "반품하기" })).toBeNull();
  expect(screen.queryByRole("button", { name: "교환하기" })).toBeNull();
});

test("배송완료면 반품·교환을 접수할 수 있다", async () => {
  getOrderDetail.mockResolvedValue(makeDetail({ orderStatus: "DELIVERED" }));
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("button", { name: "반품하기" })).toBeDefined();
  expect(screen.getByRole("button", { name: "교환하기" })).toBeDefined();
});

// 확인창에서 바로 접수되면 사유도 사진도 받지 못한다. 신청 화면으로 넘겨야 한다 (MYPA_261)
test("반품을 확인하면 그 주문의 신청 화면으로 간다", async () => {
  getOrderDetail.mockResolvedValue(makeDetail({ orderId: 7, orderStatus: "DELIVERED" }));
  render(<OrderDetailView orderId="7" />, { wrapper: createQueryWrapper() });

  fireEvent.click(await screen.findByRole("button", { name: "반품하기" }));
  const link = screen.getByRole("link", { name: "반품 접수하기" });
  expect(link.getAttribute("href")).toBe("/mypage/orders/7/claim?type=return");
});

// 목록은 첫 상품만 세우고 나머지를 수로 접는다. 상세는 무엇을 샀는지 다 보여야 한다
test("상품이 여럿이면 모두 보여주고 상태는 한 번만 붙인다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({
      items: [
        {
          orderItemId: 2,
          thumbnailUrl: null,
          productName: "사료",
          quantity: 2,
          unitPrice: 10000,
          itemStatus: "PAID",
        },
        {
          orderItemId: 3,
          thumbnailUrl: null,
          productName: "간식",
          quantity: 1,
          unitPrice: 15000,
          itemStatus: "PAID",
        },
      ],
    }),
  );
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("사료")).toBeDefined();
  expect(screen.getByText("간식")).toBeDefined();
  // 낱개 값에 수량을 곱한 것이 그 줄에 낸 돈이다
  expect(screen.getByText("20,000원")).toBeDefined();
  // 주문 단위 상태라 줄마다 반복하지 않는다
  expect(screen.getAllByText("배송준비중")).toHaveLength(1);
});

// 주문은 결제 전에도 만들어진다. 그때 `payment`가 null로 오는데 빈 카드를 세우면
// 결제가 끝난 것처럼 보인다 (백엔드 `OrderDetailResponse.from`)
test("결제 전 주문이면 결제상세 카드를 세우지 않는다", async () => {
  getOrderDetail.mockResolvedValue(makeDetail({ orderStatus: "PENDING", payment: null }));
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("heading", { name: "주문정보" })).toBeDefined();
  expect(screen.queryByRole("heading", { name: "결제상세" })).toBeNull();
  // 배송지는 결제와 무관하게 정해져 있어 그대로 보인다
  expect(screen.getByRole("heading", { name: "배송지 정보" })).toBeDefined();
});

test("조회가 실패하면 토스트 대신 화면에서 알린다", async () => {
  getOrderDetail.mockRejectedValue(new Error("network down"));
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("alert")).toBeDefined();
});

// `/mypage/orders/abc`로도 들어올 수 있다. 400을 받으러 한 번 다녀올 이유가 없다
test("주문 번호가 숫자가 아니면 서버를 부르지 않는다", async () => {
  render(<OrderDetailView orderId="abc" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("주문을 찾을 수 없어요")).toBeDefined();
  await waitFor(() => expect(getOrderDetail).not.toHaveBeenCalled());
});
