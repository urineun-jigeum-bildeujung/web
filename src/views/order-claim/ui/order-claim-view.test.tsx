// 반품·교환 신청 테스트. 서버가 거는 조건을 화면이 먼저 막는지, 고른 것이 요청에 그대로
// 실리는지 본다. 서버 규칙은 로컬 백엔드 소스에서 확인한 것이다 (#327).
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { getOrderDetail, createClaim, replace } = vi.hoisted(() => ({
  getOrderDetail: vi.fn(),
  createClaim: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

vi.mock("@/entities/order/api/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order/api/orders")>()),
  getOrderDetail,
}));

// 모듈을 통째로 갈아끼우지 않는다. `CLAIM_TYPES` 같은 상수가 함께 사라진다
vi.mock("@/entities/order/api/claims", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order/api/claims")>()),
  createClaim,
}));

vi.mock("@/shared/lib/app-toast", () => ({
  toastAppSuccess: vi.fn(),
  toastAppError: vi.fn(),
}));

import type { OrderDetail, OrderDetailItem } from "@/entities/order";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import { OrderClaimView } from "./order-claim-view";

function makeItem(over: Partial<OrderDetailItem> = {}): OrderDetailItem {
  return {
    orderItemId: 11,
    thumbnailUrl: null,
    productName: "테스트 사료",
    quantity: 2,
    unitPrice: 20000,
    itemStatus: "PAID",
    claims: [],
    ...over,
  };
}

function makeDetail(over: Partial<OrderDetail> = {}): OrderDetail {
  return {
    orderId: 1,
    orderNumber: "ORD-CLAIM-01",
    // 서버 `Order.claimable`이 배송완료만 받는다
    orderStatus: "DELIVERED",
    productAmount: 40000,
    totalAmount: 43000,
    items: [makeItem()],
    deliveryAddress: {
      receiver: "홍길동",
      receiverPhone: "010-1234-5678",
      zipCode: "06133",
      address: "서울특별시 강남구 테헤란로 123",
      addressDetail: "4층",
    },
    deliveryNote: null,
    payment: { paidAt: "2026-09-20T10:00:00+09:00", method: "토스페이먼츠 결제" },
    ...over,
  };
}

// **기본값을 두지 않는다.** `renderView(undefined)`가 기본값으로 되돌아가 유형 없는 경우를
// 시험하지 못한다 — JS 기본 매개변수는 `undefined`에도 적용된다
function renderView(type: string | undefined) {
  return render(<OrderClaimView orderId="1" type={type} />, { wrapper: createQueryWrapper() });
}

beforeEach(() => {
  vi.clearAllMocks();
  getOrderDetail.mockResolvedValue(makeDetail());
  createClaim.mockResolvedValue({
    claimId: 5,
    claimType: "RETURN",
    claimStatus: "REQUESTED",
    requestedAt: "2026-09-22T09:00:00Z",
  });
});

test("진입 유형이 제목과 버튼에 선다", async () => {
  renderView("exchange");

  // 머리말은 조회 전에도 서므로 상품이 그려질 때까지 기다린 뒤 버튼을 본다
  expect(await screen.findByText("테스트 사료")).toBeDefined();
  expect(screen.getByRole("heading", { name: "교환 신청" })).toBeDefined();
  expect(screen.getByRole("button", { name: "교환 신청하기" })).toBeDefined();
});

// 주문 상세 확인창이 유형을 실어 보내는데 주소를 손으로 치고 들어올 수 있다
test("유형 없이 들어오면 신청할 수 없다고 알린다", async () => {
  renderView(undefined);

  expect(await screen.findByText("신청 유형 없음")).toBeDefined();
  expect(screen.queryByRole("button", { name: /신청하기/ })).toBeNull();
});

// 서버 `Order.java`가 DELIVERED에만 신청을 받는다. 보내 보고 409를 받을 일이 아니다
test("배송완료가 아니면 신청 기간이 아니라고 알린다", async () => {
  getOrderDetail.mockResolvedValue(makeDetail({ orderStatus: "SHIPPING" }));
  renderView("return");

  expect(await screen.findByText("신청 기간 지남")).toBeDefined();
  expect(screen.queryByRole("button", { name: /신청하기/ })).toBeNull();
});

// 서버가 품목 하나만 걸려도 요청 전체를 거절한다. 고르지 못하게 먼저 막는다
test("진행 중인 신청이 걸린 상품은 고를 수 없다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({
      items: [
        makeItem({ orderItemId: 11, productName: "신청 중인 사료" }),
        makeItem({ orderItemId: 12, productName: "고를 수 있는 간식" }),
      ].map((item, index) =>
        index === 0
          ? {
              ...item,
              claims: [
                {
                  claimId: 1,
                  claimType: "RETURN",
                  claimStatus: "COLLECTING",
                  requestedAt: "2026-09-21T09:00:00Z",
                  completedAt: null,
                },
              ],
            }
          : item,
      ),
    }),
  );
  renderView("return");

  expect(await screen.findByText("고를 수 있는 간식")).toBeDefined();
  expect(screen.queryByText("신청 중인 사료")).toBeNull();
});

test("모든 상품에 신청이 걸려 있으면 진행 중이라고 알린다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({
      items: [
        makeItem({
          claims: [
            {
              claimId: 1,
              claimType: "RETURN",
              claimStatus: "REQUESTED",
              requestedAt: "2026-09-21T09:00:00Z",
              completedAt: null,
            },
          ],
        }),
      ],
    }),
  );
  renderView("return");

  expect(await screen.findByText("신청 진행 중")).toBeDefined();
});

// 끝난 신청은 막지 않는다. `ClaimStatus.terminalStates()`가 COMPLETED·REJECTED 둘이다
test("끝난 신청이 있는 상품은 다시 고를 수 있다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({
      items: [
        makeItem({
          claims: [
            {
              claimId: 1,
              claimType: "RETURN",
              claimStatus: "REJECTED",
              requestedAt: "2026-09-20T09:00:00Z",
              completedAt: "2026-09-21T09:00:00Z",
            },
          ],
        }),
      ],
    }),
  );
  renderView("return");

  expect(await screen.findByText("테스트 사료")).toBeDefined();
});

test("하나도 고르지 않으면 신청 버튼이 잠긴다", async () => {
  renderView("return");

  const submit = await screen.findByRole("button", { name: "반품 신청하기" });
  expect(submit.hasAttribute("disabled")).toBe(true);

  fireEvent.click(screen.getByRole("checkbox"));
  expect(submit.hasAttribute("disabled")).toBe(false);
});

// 스테퍼 상한이 주문 수량이다. 넘겨 보내면 서버가 CLAIM_ITEM_QUANTITY_EXCEEDED로 거절한다
test("수량은 주문 수량을 넘지 못한다", async () => {
  renderView("return");

  fireEvent.click(await screen.findByRole("checkbox"));
  const plus = screen.getByRole("button", { name: "테스트 사료 신청 수량 하나 늘리기" });

  fireEvent.click(plus);
  expect(screen.getByText("2")).toBeDefined();
  expect(plus.hasAttribute("disabled")).toBe(true);
});

test("고른 상품과 사유가 그대로 실려 나가고 주문 상세로 돌아간다", async () => {
  renderView("return");

  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.change(screen.getByLabelText("사유 (선택)"), {
    target: { value: "  포장이 찢어져 있었어요  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "반품 신청하기" }));

  await waitFor(() => expect(createClaim).toHaveBeenCalled());
  expect(createClaim).toHaveBeenCalledWith(1, {
    claimType: "RETURN",
    reason: "포장이 찢어져 있었어요",
    items: [{ orderItemId: 11, quantity: 1 }],
  });
  // 뒤로가기로 방금 접수한 화면에 돌아오면 두 번 보내게 된다
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/mypage/orders/1"));
});

// 빈 문자열을 보내면 서버가 사유를 남긴 것으로 저장한다
test("사유를 쓰지 않으면 보내지 않는다", async () => {
  renderView("return");

  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "반품 신청하기" }));

  await waitFor(() => expect(createClaim).toHaveBeenCalled());
  expect(createClaim.mock.calls[0][1].reason).toBeUndefined();
});
