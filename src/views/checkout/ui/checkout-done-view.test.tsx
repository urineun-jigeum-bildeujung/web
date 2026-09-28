// 주문 완료 테스트. 무엇을 샀는지와 다음에 갈 곳이 보이는지 본다.
//
// **승인과 주문 조회를 목으로 바꾼다.** 화면이 두 훅을 직접 부르게 되면서(#308) 서버를 타지
// 않고도 각 상태를 세울 수 있어야 한다.
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { OrderDetail } from "@/entities/order";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

const { useQueryPaymentConfirm, useQueryOrderDetail, useMarkOrdersStale, removePaidCartItems } =
  vi.hoisted(() => ({
    useQueryPaymentConfirm: vi.fn(),
    useQueryOrderDetail: vi.fn(),
    useMarkOrdersStale: vi.fn(),
    removePaidCartItems: vi.fn(),
  }));

vi.mock("../api/use-query-payment-confirm", () => ({ useQueryPaymentConfirm }));
// 캐시를 실제로 어떻게 건드리는지는 훅 테스트가 본다. 여기서는 언제 켜는지만 본다
vi.mock("../api/use-mark-orders-stale", () => ({ useMarkOrdersStale }));
// 실제로 어떻게 빼는지는 훅 테스트가 본다. 여기서는 언제 무엇을 넘기는지만 본다
vi.mock("../api/use-remove-paid-cart-items", () => ({
  useRemovePaidCartItems: () => removePaidCartItems,
}));
vi.mock("@/entities/order", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order")>()),
  useQueryOrderDetail,
}));

import { ApiError } from "@/shared/api/client";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";

import { readPendingOrder, writePendingOrder } from "../model/pending-order";
import { CheckoutDoneView } from "./checkout-done-view";

const PAYMENT = {
  paymentId: 1,
  // 승인 응답이 주는 숫자 주문 id. 주소창 값보다 이쪽이 이긴다 (#374)
  orderId: 77,
  orderNumber: "ORD-20260919-000001",
  paymentStatus: "DONE",
  amount: 12345,
  method: "간편결제",
  // **목에 오프셋을 붙여 둔다.** 백엔드가 `OffsetDateTime`이라 실제 응답에는 `+09:00`이 붙는다.
  // 빼면 `new Date`가 실행 환경의 시간대로 읽어, KST에서 짠 기대값이 UTC로 도는 CI에서 깨진다 (#295)
  approvedAt: "2026-09-19T14:30:00+09:00",
};

const ORDER: OrderDetail = {
  orderId: 77,
  orderNumber: "ORD-20260919-000001",
  orderStatus: "PAID",
  deliveredAt: null,
  productAmount: 9345,
  totalAmount: 12345,
  items: [
    {
      orderItemId: 1,
      productName: "종근당 캣츠벨",
      thumbnailUrl: null,
      quantity: 2,
      unitPrice: 4672,
      itemStatus: "PAID",
      cancelledQuantity: 0,
      returnedQuantity: 0,
      effectiveQuantity: 2,
      claims: [],
    },
  ],
  deliveryAddress: {
    receiver: "천경진",
    receiverPhone: "010-1234-5678",
    zipCode: "06234",
    address: "서울특별시 강남구 테헤란로 123",
    addressDetail: "UI타워 4층 404호",
  },
  deliveryNote: "문 앞에 놓아주세요.",
  payment: { paidAt: "2026-09-19T14:30:00+09:00", method: "간편결제" },
};

/** 승인이 끝나고 주문도 받아 온, 가장 흔한 상태 */
function ready() {
  useQueryPaymentConfirm.mockReturnValue({
    payment: PAYMENT,
    error: null,
    canConfirm: true,
  });
  useQueryOrderDetail.mockReturnValue({
    order: ORDER,
    error: null,
    isLoading: false,
    isFetching: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  ready();
});

/** 결제 화면이 주문과 함께 적어 둔 장바구니 줄 */
const PAID_LINES = [{ itemType: "NORMAL" as const, itemId: 1 }];

function holdPendingOrder(orderId: number | null = 77) {
  writePendingOrder({ signature: "x", idempotencyKey: "k", orderId, cartItems: PAID_LINES });
}

/** 화면이 라우트에서 받는 값들 */
const QUERY = { paymentKey: "tviva20260919", tossOrderId: "ORD-20260919-000001", amount: 12345 };

test("주문번호를 알린다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByText("주문을 무사히 마쳤어요")).toBeDefined();
  expect(screen.getByText("ORD-20260919-000001")).toBeDefined();
});

// 서버는 결제가 끝나도 장바구니를 비우지 않는다. 두면 방금 산 상품이 남아 또 결제될 수 있다 (#457)
test("승인이 끝나면 결제한 장바구니 줄을 뺀다", () => {
  holdPendingOrder();

  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(removePaidCartItems).toHaveBeenCalledTimes(1);
  expect(removePaidCartItems).toHaveBeenCalledWith(PAID_LINES);
  // 들고 있던 주문은 그대로 비운다 (#367)
  expect(readPendingOrder()).toBeNull();
});

test("다시 그려져도 한 번만 뺀다", () => {
  holdPendingOrder();

  const { rerender } = render(<CheckoutDoneView {...QUERY} orderId={77} />);
  rerender(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(removePaidCartItems).toHaveBeenCalledTimes(1);
});

/**
 * **뒤로가기로 옛 완료 화면에 다시 들어온 경우다.** 승인 결과는 캐시에 남아 있어 바로 채워지고,
 * 탭에 든 것은 그 뒤에 시작한 다른 결제의 주문이다. 꺼내면 아직 사지 않은 줄이 빠지고, 비우면
 * 그 주문을 풀어 줄 id를 잃는다 (#476).
 */
test("다른 주문의 완료 화면에 다시 들어와도 들고 있는 주문과 장바구니를 건드리지 않는다", () => {
  holdPendingOrder(103);

  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(removePaidCartItems).not.toHaveBeenCalled();
  expect(readPendingOrder()?.orderId).toBe(103);
});

// 주소창의 `?order=`는 사용자가 바꿀 수 있다. 승인한 주문이 아니면 그 줄을 산 것이 아니다 (#476)
test("승인한 주문이 들고 있던 주문과 다르면 장바구니 줄을 빼지 않는다", () => {
  holdPendingOrder(103);

  render(<CheckoutDoneView {...QUERY} orderId={103} />);

  expect(removePaidCartItems).not.toHaveBeenCalled();
});

// 주소창으로 직접 들어오면 어느 주문의 완료 화면인지 모른다. 아직 만들지 못한 주문도 건드리지 않는다.
// 라우트는 `?order=`가 없으면 `null`을 넘긴다(`readOrderId`)
test("주소창에 주문 id가 없으면 들고 있는 주문을 비우지 않는다", () => {
  holdPendingOrder(null);

  render(<CheckoutDoneView {...QUERY} orderId={null} />);

  expect(removePaidCartItems).not.toHaveBeenCalled();
  expect(readPendingOrder()).not.toBeNull();
});

// 서버가 배송 예정일을 주지 않는다. 시안 문구를 그대로 두면 지난 날짜가 모든 주문에 뜬다 (#262)
test("서버가 주지 않는 도착 예정일은 그리지 않는다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.queryByText(/도착할 예정이에요/)).toBeNull();
});

test("결제일시를 승인 응답으로 보인다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByText("26.09.19 14:30")).toBeDefined();
});

// 읽을 수 없으면 줄을 비운다. 지어낸 날짜를 보이느니 안 보이는 편이 낫다. 승인 응답에 늘 오는
// 값이라 빠지는 경우는 없고, 남는 것은 읽을 수 없는 문자열이다(#474)
test("승인 시각을 읽을 수 없으면 결제일시를 비운다", () => {
  // 승인 응답이 없으면 완료 화면 대신 뼈대가 선다. 응답은 두고 시각만 바꾼다 (#468)
  useQueryPaymentConfirm.mockReturnValue({
    payment: { ...PAYMENT, approvedAt: "not-a-date" },
    error: null,
    canConfirm: true,
  });
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  // 뼈대만 떠서 통과하는 것이 아니라 완료 화면에서 그 줄만 비었는지 본다
  expect(screen.getByText("주문을 무사히 마쳤어요")).toBeDefined();
  expect(screen.queryByText(/^\d{2}\.\d{2}\.\d{2} /)).toBeNull();
});

// **목 데이터를 걷었다.** 그전에는 결제를 마친 모두가 `상품명`·`천경진`·`테헤란로 123`을 봤다 (#308)
test("상품과 배송지를 실제 주문에서 가져온다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByText("종근당 캣츠벨")).toBeDefined();
  expect(screen.getByText("천경진")).toBeDefined();
  expect(screen.getByText("서울특별시 강남구 테헤란로 123 UI타워 4층 404호")).toBeDefined();
  // 판매 금액은 주문의 상품 금액이다
  expect(screen.getByText("9,345원")).toBeDefined();
  // 배송비는 결제 금액에서 상품 금액을 뺀다 (#448)
  expect(screen.getByText("3,000원")).toBeDefined();
});

// UI 페이지 시안(1117:4759)의 이름을 쓴다. 옛 와이어프레임 문구가 남아 있었다 (#439)
test("결제상세와 배송지를 시안의 이름으로 부른다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  // 배송비 줄은 시안에 없지만 PD팀이 넣기로 했다 (2026-09-28, #448)
  for (const term of ["판매 금액", "배송비", "받는 분", "연락처", "주소", "배송 요청사항"]) {
    expect(screen.getByText(term)).toBeDefined();
  }
  for (const term of ["상품 옵션", "받는 사람", "배송지 주소"]) {
    expect(screen.queryByText(term)).toBeNull();
  }
});

// 시안은 이름 아래 수량 줄을 두지 않는다. 여럿이면 나머지 수만 적는다 (#439)
test("상품이 하나면 수량 줄 없이 이름만 둔다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.queryByText("2개")).toBeNull();
  expect(screen.queryByText(/외 \d+건/)).toBeNull();
});

test("상품이 여럿이면 첫 상품 아래에 나머지 수를 적는다", () => {
  const second = { ...ORDER.items[0], orderItemId: 2, productName: "로얄캐닌 인도어" };
  useQueryOrderDetail.mockReturnValue({
    order: { ...ORDER, items: [ORDER.items[0], second] },
    error: null,
    isLoading: false,
    isFetching: false,
  });
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByText("종근당 캣츠벨")).toBeDefined();
  expect(screen.getByText("외 1건")).toBeDefined();
  expect(screen.queryByText("로얄캐닌 인도어")).toBeNull();
});

// 빈 칸을 남기면 배송지가 없는 주문처럼 보인다
test("주문을 못 받아 오면 배송지 블록을 세우지 않는다", () => {
  useQueryOrderDetail.mockReturnValue({ order: undefined, error: null, isLoading: false });
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.queryByRole("heading", { name: "배송지 정보" })).toBeNull();
  // 결제상세는 승인 응답만으로도 세울 수 있어 남는다
  expect(screen.getByRole("heading", { name: "결제상세" })).toBeDefined();
});

test("결제 내역을 남긴다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByRole("heading", { name: "결제상세" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "배송지 정보" })).toBeDefined();
  // 결제수단은 글자가 아니라 로고다. PD팀이 토스페이 로고로 통일하라고 확정했다 (#304)
  expect(screen.getByRole("img", { name: "토스페이" })).toBeDefined();
});

// 눌렸는지 모른 채 기다리면 같은 자리를 다시 누르거나 떠난다 (AGENTS.md 5.8)
test("승인을 기다리는 동안 자리를 잡는다", () => {
  useQueryPaymentConfirm.mockReturnValue({
    payment: undefined,
    error: null,
    canConfirm: true,
  });
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByRole("status", { name: "결제를 확인하는 중" })).toBeDefined();
  expect(screen.queryByText("주문을 무사히 마쳤어요")).toBeNull();
});

// 방금 한 주문을 바로 볼 수 있어야 주문 내역을 다시 찾아 들어가지 않는다 (paym_002)
test("방금 산 주문의 상세로 갈 수 있다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByRole("link", { name: "주문 상세 보기" }).getAttribute("href")).toBe(
    "/mypage/orders/77",
  );
  expect(screen.getByRole("link", { name: "홈으로 가기" }).getAttribute("href")).toBe("/");
});

/**
 * **승인 응답의 주문 id가 주소창 값을 이긴다.**
 *
 * `?order=`는 사용자가 바꿀 수 있어, 그대로 믿으면 이 결제와 상관없는 주문으로 보낸다.
 * 그전에는 응답에 숫자 id가 없어 우리가 실어 보내는 수밖에 없었다 (#301 → #374).
 */
test("주소창을 고쳐도 승인 응답이 준 주문으로 간다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={999} />);

  expect(screen.getByRole("link", { name: "주문 상세 보기" }).getAttribute("href")).toBe(
    "/mypage/orders/77",
  );
});

// 승인 응답이 주므로 주소창에 없어도 상세로 갈 수 있다
test("주소창에 주문 id가 없어도 상세로 갈 수 있다", () => {
  render(<CheckoutDoneView {...QUERY} />);

  expect(screen.getByRole("link", { name: "주문 상세 보기" }).getAttribute("href")).toBe(
    "/mypage/orders/77",
  );
});

// 받아 오지 못한 주문의 상세로 보내느니 목록이 낫다. 전에는 승인 응답이 없는 경우로 봤는데,
// 그때는 완료 화면 대신 뼈대가 선다 (#468)
test("주문을 못 받아 오면 주문 내역으로 보낸다", () => {
  useQueryOrderDetail.mockReturnValue({ order: undefined, error: null, isLoading: false });
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.queryByRole("link", { name: "주문 상세 보기" })).toBeNull();
  expect(screen.getByRole("link", { name: "주문 내역 보기" }).getAttribute("href")).toBe(
    "/mypage/orders",
  );
});

// 되돌아갈 곳이 없는 화면이다. 시안(1117:4759)은 머리에 닫기도 없이 아래 두 버튼으로 나가게 한다 (#439)
test("머리에 뒤로가기와 닫기를 두지 않고 아래 버튼으로 나간다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.queryByRole("link", { name: "닫기" })).toBeNull();
  expect(screen.queryByRole("button", { name: "이전 화면으로" })).toBeNull();
  expect(screen.getByRole("link", { name: "홈으로 가기" }).getAttribute("href")).toBe("/");
});

/** 승인 실패를 세운다. 그때 화면이 댈 수 있는 식별자는 토스가 준 주문번호뿐이다 */
function failed(error: unknown = new Error("승인 실패")) {
  useQueryPaymentConfirm.mockReturnValue({
    payment: undefined,
    error,
    canConfirm: true,
  });
}

// 승인이 막히면 결제가 끝났는지 알 수 없다. 장바구니를 남겨야 다시 살 수 있다 (#457)
test("승인이 막히면 장바구니 줄을 빼지 않는다", () => {
  holdPendingOrder();
  failed();

  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(removePaidCartItems).not.toHaveBeenCalled();
  // 들고 있던 주문은 비운다. 그 주문은 이미 결제창을 거쳐 새 결제를 붙일 자리가 아니다 (#367)
  expect(readPendingOrder()).toBeNull();
});

/**
 * 승인이 막히면 결제창에서는 이미 성공한 뒤라 **돈이 빠져나갔을 수 있다.**
 * 그 상태에서 화면이 해야 할 일은 사실을 알리고 문의할 수단을 주는 것이다 (#260).
 */
test("승인이 실패하면 완료가 아니라 그 사실을 알린다", () => {
  failed();
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByRole("alert")).toBeDefined();
  expect(screen.getByText(APP_MESSAGE[APP_MESSAGE_CODE.payment.confirmFailed].title)).toBeDefined();
  // 성공 화면의 문구가 함께 뜨면 안 된다
  expect(screen.queryByText("주문을 무사히 마쳤어요")).toBeNull();
});

// **`payment.*` 문구는 그대로 쓴다.** 금액이 어긋난 것은 사용자가 알아야 할 다른 사실이다 —
// 결제됐다면 백엔드가 자동으로 취소한다 (#260). 라우트 테스트와 함께 지워졌던 것을 되살렸다 (#468)
test("금액이 어긋나면 그 사유로 알린다", () => {
  // 백엔드 `PaymentErrorCode.AMOUNT_MISMATCH`는 400이 아니라 409다 (#310)
  failed(new ApiError(409, "금액 불일치", { errorCode: "PAYMENT_409_AMOUNT_MISMATCH" }));
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(
    screen.getByText(APP_MESSAGE[APP_MESSAGE_CODE.payment.amountMismatch].title),
  ).toBeDefined();
  expect(screen.queryByText(APP_MESSAGE[APP_MESSAGE_CODE.payment.confirmFailed].title)).toBeNull();
});

/**
 * **결제 밖의 문구는 승인 실패 문구로 모은다.** 네트워크 오류는 평소 "네트워크 상태를 확인해
 * 주세요"로 떨어지는데, 이 화면에서 그 말은 다시 시도하라는 뜻으로 읽혀 두 번 결제로 이어진다
 * (#260). 라우트 테스트와 함께 지워졌던 것을 되살렸다 (#468)
 */
test("결제와 무관한 오류도 승인 실패 문구로 모은다", () => {
  failed(new TypeError("Failed to fetch"));
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByText(APP_MESSAGE[APP_MESSAGE_CODE.payment.confirmFailed].title)).toBeDefined();
  expect(
    screen.queryByText(APP_MESSAGE[APP_MESSAGE_CODE.common.networkError].description),
  ).toBeNull();
});

// 승인 응답이 없으니 화면이 댈 수 있는 식별자가 이것뿐이다. 문의할 때 사용자가 부르는 번호다
test("승인이 실패해도 주문번호는 보인다", () => {
  failed();
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByText("주문번호")).toBeDefined();
  expect(screen.getByText("ORD-20260919-000001")).toBeDefined();
});

/**
 * **다시 결제하러 가는 길을 주지 않는다.** 이미 결제됐을 수 있어 다시 누를 자리를 만들면
 * 두 번 결제될 여지가 생긴다.
 */
test("승인이 실패하면 다시 결제하러 보내지 않는다", () => {
  failed();
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
  expect(hrefs).not.toContain("/payment");
  expect(hrefs).toContain("/mypage/support");
  expect(hrefs).toContain("/mypage/orders");
});

/**
 * **승인 실패가 대기 표시에 가려지면 안 된다.**
 *
 * 승인이 막힌 것은 확정된 사실이고 그 시점엔 이미 돈이 나갔을 수 있다. 주문 조회가 아직
 * 끝나지 않았다고 뼈대로 덮으면 문의할 수단을 손에 쥐지 못한 채 기다리게 된다 (#308 리뷰).
 */
test("주문을 받는 중이어도 승인 실패를 먼저 알린다", () => {
  failed();
  useQueryOrderDetail.mockReturnValue({
    order: undefined,
    error: null,
    isLoading: true,
    isFetching: true,
  });

  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByRole("alert")).toBeDefined();
  expect(screen.queryByRole("status", { name: "결제를 확인하는 중" })).toBeNull();
  expect(screen.getByRole("link", { name: "문의하기" })).toBeDefined();
});

// 결제 금액만 알고 그 안을 가를 수 없는데 `0원`으로 그리면 실제로 0원인 것처럼 보인다
test("주문이 없으면 상품 줄과 세부 금액을 비운다", () => {
  useQueryOrderDetail.mockReturnValue({ order: undefined, error: null, isLoading: false });

  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.queryByText("판매 금액")).toBeNull();
  expect(screen.queryByText("배송비")).toBeNull();
  expect(screen.queryByText("0원")).toBeNull();
  // 승인 응답만으로 세울 수 있는 것은 남는다
  expect(screen.getByText("12,345원")).toBeDefined();
});

/**
 * **이 화면이 받은 상세는 승인 전 모습이다.** 서버는 승인 뒤 이벤트를 거쳐 결제 완료를 1초 남짓
 * 늦게 적는다. 낡았다고 표시하지 않으면 60초 동안 주문 상세가 그 모습을 써서 결제상세와 취소
 * 버튼이 빠진다 (#416).
 */
test("승인과 주문 조회가 끝나면 주문 캐시를 낡은 것으로 표시한다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(useMarkOrdersStale).toHaveBeenLastCalledWith(true);
});

// 조회가 아직이면 표시해 봐야 뒤이어 도착한 응답이 표시를 지운다. 끝난 뒤에 해야 남는다
test("주문 조회가 끝나기 전에는 표시하지 않는다", () => {
  useQueryOrderDetail.mockReturnValue({
    order: undefined,
    error: null,
    isLoading: true,
    isFetching: true,
  });

  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(useMarkOrdersStale).toHaveBeenLastCalledWith(false);
});

// 받아 둔 주문이 있으면 다시 받는 동안 `isLoading`은 거짓이다. 그때 표시하면 끝나며 도착한 응답이
// 표시를 지워, 주문 상세가 결제 전 모습을 다시 쓴다 (#419 리뷰)
test("받아 둔 주문을 뒤에서 다시 받는 중에도 표시하지 않는다", () => {
  useQueryOrderDetail.mockReturnValue({
    order: ORDER,
    error: null,
    isLoading: false,
    isFetching: true,
  });

  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(useMarkOrdersStale).toHaveBeenLastCalledWith(false);
});

// 승인이 끝나지 않았으면 바뀐 것이 없다
test("승인이 끝나기 전에는 표시하지 않는다", () => {
  useQueryPaymentConfirm.mockReturnValue({
    payment: undefined,
    error: null,
    canConfirm: true,
  });

  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(useMarkOrdersStale).toHaveBeenLastCalledWith(false);
});

// **dl 아래에는 이름·값 짝만 온다.** 복사 버튼이 dl 바로 아래에 있으면 보조기기가 목록 구조를
// 잘못 읽는다(`definition-list`). 승인 실패 화면에만 그려지는 자리다 (#422)
test("승인 실패 화면의 주문번호 dl에는 이름·값만 있고 복사 버튼은 그 밖에 있다", () => {
  failed();
  const { container } = render(<CheckoutDoneView {...QUERY} orderId={77} />);

  const list = container.querySelector("dl");
  expect(list).not.toBeNull();
  for (const child of [...list!.children]) {
    expect(["DT", "DD", "DIV"]).toContain(child.tagName);
  }
  expect(list!.querySelector("button")).toBeNull();
  expect(screen.getByRole("button", { name: /복사/ })).toBeDefined();
});
