// 주문 완료 테스트. 무엇을 샀는지와 다음에 갈 곳이 보이는지 본다.
//
// **승인과 주문 조회를 목으로 바꾼다.** 화면이 두 훅을 직접 부르게 되면서(#308) 서버를 타지
// 않고도 각 상태를 세울 수 있어야 한다.
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { OrderDetail } from "@/entities/order";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

const { useQueryPaymentConfirm, useQueryOrderDetail, useMarkOrdersStale } = vi.hoisted(() => ({
  useQueryPaymentConfirm: vi.fn(),
  useQueryOrderDetail: vi.fn(),
  useMarkOrdersStale: vi.fn(),
}));

vi.mock("../api/use-query-payment-confirm", () => ({ useQueryPaymentConfirm }));
// 캐시를 실제로 어떻게 건드리는지는 훅 테스트가 본다. 여기서는 언제 켜는지만 본다
vi.mock("../api/use-mark-orders-stale", () => ({ useMarkOrdersStale }));
vi.mock("@/entities/order", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order")>()),
  useQueryOrderDetail,
}));

import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";

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
    isConfirming: false,
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
  ready();
});

/** 화면이 라우트에서 받는 값들 */
const QUERY = { paymentKey: "tviva20260919", tossOrderId: "ORD-20260919-000001", amount: 12345 };

test("주문번호를 알린다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByText("주문을 무사히 마쳤어요")).toBeDefined();
  expect(screen.getByText("ORD-20260919-000001")).toBeDefined();
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

// 값이 없거나 읽을 수 없으면 줄을 비운다. 지어낸 날짜를 보이느니 안 보이는 편이 낫다
test("승인 시각이 없으면 결제일시를 비운다", () => {
  // `ready({ payment: undefined })`는 기본 매개변수가 되살려서 안 된다. 직접 세운다
  useQueryPaymentConfirm.mockReturnValue({
    payment: undefined,
    error: null,
    isConfirming: false,
    canConfirm: true,
  });
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.queryByText(/^\d{2}\.\d{2}\.\d{2} /)).toBeNull();
});

// **목 데이터를 걷었다.** 그전에는 결제를 마친 모두가 `상품명`·`천경진`·`테헤란로 123`을 봤다 (#308)
test("상품과 배송지를 실제 주문에서 가져온다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByText("종근당 캣츠벨")).toBeDefined();
  expect(screen.getByText("2개")).toBeDefined();
  expect(screen.getByText("천경진")).toBeDefined();
  expect(screen.getByText("서울특별시 강남구 테헤란로 123 UI타워 4층 404호")).toBeDefined();
  // 배송비는 결제 금액에서 상품 금액을 뺀다
  expect(screen.getByText("3,000원")).toBeDefined();
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
    isConfirming: true,
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

// 주소창으로 직접 들어와 승인도 안 된 경우다. 엉뚱한 주문을 여느니 목록이 낫다
test("승인 결과가 없으면 주문 내역으로 보낸다", () => {
  useQueryPaymentConfirm.mockReturnValue({
    payment: undefined,
    error: null,
    isConfirming: false,
    canConfirm: true,
  });
  render(<CheckoutDoneView {...QUERY} />);

  expect(screen.queryByRole("link", { name: "주문 상세 보기" })).toBeNull();
  expect(screen.getByRole("link", { name: "주문 내역 보기" }).getAttribute("href")).toBe(
    "/mypage/orders",
  );
});

// 되돌아갈 곳이 없는 화면이라 뒤로가기 대신 닫기를 둔다
test("뒤로가기 대신 닫기가 있다", () => {
  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.getByRole("link", { name: "닫기" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "이전 화면으로" })).toBeNull();
});

/** 승인 실패를 세운다. 그때 화면이 댈 수 있는 식별자는 토스가 준 주문번호뿐이다 */
function failed() {
  useQueryPaymentConfirm.mockReturnValue({
    payment: undefined,
    error: new Error("승인 실패"),
    isConfirming: false,
    canConfirm: true,
  });
}

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

  expect(screen.queryByText("상품 옵션")).toBeNull();
  expect(screen.queryByText("배송비")).toBeNull();
  expect(screen.queryByText("0원")).toBeNull();
  // 승인 응답만으로 세울 수 있는 것은 남는다
  expect(screen.getByText("12,345원")).toBeDefined();
});

// `?order=`는 주소창에서 바꿀 수 있다. 두 주문이 한 화면에 섞이면 안 된다
test("승인 결과와 다른 주문이면 그 주문 값을 쓰지 않는다", () => {
  useQueryOrderDetail.mockReturnValue({
    order: { ...ORDER, orderNumber: "ORD-20260919-999999" },
    error: null,
    isLoading: false,
  });

  render(<CheckoutDoneView {...QUERY} orderId={77} />);

  expect(screen.queryByText("종근당 캣츠벨")).toBeNull();
  expect(screen.queryByRole("heading", { name: "배송지 정보" })).toBeNull();
  expect(screen.queryByRole("link", { name: "주문 상세 보기" })).toBeNull();
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
    isConfirming: true,
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
