// 결제하기 테스트. 금액 표시와 결제 잠금, 주문 생성부터 결제창까지의 순서를 본다.
//
// 조회는 가짜로 둔다. 무엇을 보내고 받은 것을 어떻게 다루는지는 `entities/cart`·
// `entities/address`·`entities/pet`이 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ApiError } from "@/shared/api/client";
import { useEffect } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import type { CartItem } from "@/entities/cart";

import type { TossPaymentOrder } from "./toss-payment-widget";

const { requestPayment, toastAppError, createOrder, preparePayment } = vi.hoisted(() => ({
  requestPayment: vi.fn(),
  toastAppError: vi.fn(),
  createOrder: vi.fn(),
  preparePayment: vi.fn(),
}));

const useQueryCart = vi.fn();
const useQueryAddresses = vi.fn();
const useQueryPets = vi.fn();

vi.mock("@/shared/lib/app-toast", () => ({ toastAppError }));

/** 테스트마다 쿼리를 바꾼다. 결제창 복귀(`?code=`)와 고른 줄(`?items=`)이 여기로 들어온다 */
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => searchParams,
}));

// `cartItemKey`는 화면과 `pickOrderItems`가 같은 규칙을 써야 하므로 진짜를 그대로 둔다
vi.mock("@/entities/cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/cart")>()),
  useQueryCart: () => useQueryCart(),
}));
vi.mock("@/entities/address", () => ({ useQueryAddresses: () => useQueryAddresses() }));
vi.mock("@/entities/pet", () => ({ useQueryPets: () => useQueryPets() }));

vi.mock("../api/orders", () => ({ createOrder }));
vi.mock("../api/payment", () => ({ preparePayment }));

// 위젯은 토스 서버에서 스크립트를 받아 온다. 테스트에서는 준비됐다고만 알린다
vi.mock("./toss-payment-widget", () => ({
  TossPaymentWidget: ({
    onReady,
  }: {
    onReady: (fn: (order: TossPaymentOrder) => Promise<void>) => void;
  }) => {
    useEffect(() => {
      onReady(requestPayment);
    }, [onReady]);
    return <div data-testid="toss-widget" />;
  },
}));

import { CheckoutView } from "./checkout-view";

// 앞 테스트의 호출 기록이 남으면 "부르지 않았다"를 단언할 수 없다
beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
  // 만들어 둔 주문이 테스트 사이에 남으면 다음 테스트가 그것을 다시 쓴다
  sessionStorage.clear();
});

/** 명세 예시를 옮긴 배송지 */
const HOME = {
  addressId: 5,
  addressName: "집",
  receiver: "홍길동",
  phone: "010-1234-5678",
  zipCode: "06133",
  address: "서울특별시 강남구 테헤란로 123",
  addressDetail: "UI타워 4층 404호",
  deliveryNote: null,
  isDefault: true,
};

const STUDIO = { ...HOME, addressId: 9, addressName: "자취방", isDefault: false };

/** 아이 조회는 기본 아이를 앞으로 정렬해 준다(`getPets`). 그 결과를 그대로 흉내 낸다 */
const COCO = { id: "3", name: "코코", isDefault: true };
const BORI = { id: "7", name: "보리", isDefault: false };

const ITEM: CartItem = {
  itemType: "NORMAL",
  itemId: 1,
  quantity: 1,
  available: true,
  unavailableReason: null,
  productName: "종근당 캣츠벨",
  thumbnailUrl: null,
  price: 9345,
  originalPrice: 9345,
  discountRate: 0,
  subtotal: 9345,
  dealEndAt: null,
};

/** 조회가 끝나 배송지와 상품이 모두 있는 평상시 화면 */
function renderView({
  items = [ITEM],
  addresses = [HOME],
  cartState = {},
  addressState = {},
  petState = {},
}: {
  items?: CartItem[];
  addresses?: (typeof HOME)[];
  cartState?: Record<string, unknown>;
  addressState?: Record<string, unknown>;
  petState?: Record<string, unknown>;
} = {}) {
  useQueryCart.mockReturnValue({
    cart: { memberId: 1, items, totalAmount: 9345 },
    isLoading: false,
    error: null,
    ...cartState,
  });
  useQueryAddresses.mockReturnValue({
    addresses,
    isLoading: false,
    error: null,
    ...addressState,
  });
  useQueryPets.mockReturnValue({ pets: [COCO, BORI], isLoading: false, error: null, ...petState });
  return render(<CheckoutView />);
}

/** 필수 셋을 켠다. 켜야 결제 버튼이 열린다 */
function agreeRequired() {
  for (const label of [
    "[필수] 주문 상품 정보 동의",
    "[필수] 개인정보 제3자 제공 동의",
    "[필수] 결제 대행 서비스(PG) 이용 약관 동의",
  ]) {
    fireEvent.click(screen.getByLabelText(label));
  }
}

test("결제 내역을 항목별로 읽을 수 있다", () => {
  renderView();

  expect(screen.getByText("종근당 캣츠벨")).toBeDefined();
  expect(screen.getByText("배송비")).toBeDefined();
  expect(screen.getByText("3,000원")).toBeDefined();
  // 상품 9,345원 + 배송비 3,000원
  expect(screen.getByText("12,345원")).toBeDefined();
  // 시안(paym_001)이 수량을 이름과 값으로 나눠 둔다
  expect(screen.getByText("주문 수량")).toBeDefined();
  expect(screen.getByText("1개")).toBeDefined();
});

// 회원가입·온보딩에 배송지를 받는 자리가 없어 결제 화면이 기본 배송지를 쓴다 (#255)
test("기본 배송지를 보여준다", () => {
  renderView({ addresses: [STUDIO, HOME] });

  expect(screen.getByText(HOME.receiver)).toBeDefined();
  expect(screen.getByText(`${HOME.address} ${HOME.addressDetail}`)).toBeDefined();
  expect(screen.getByRole("link", { name: "배송지 변경" }).getAttribute("href")).toBe(
    "/payment/address",
  );
});

// 시안 `empty_dilivery 2`. 고를 목록이 없으므로 설정이 아니라 등록으로 보낸다
test("등록된 배송지가 없으면 등록하러 보낸다", () => {
  renderView({ addresses: [] });

  expect(screen.getByText("아직 등록된 배송지가 없어요")).toBeDefined();
  // 등록을 마치면 이 화면으로 돌아와야 결제를 이어갈 수 있다 (#369)
  expect(screen.getByRole("link", { name: "배송지 등록" }).getAttribute("href")).toBe(
    "/mypage/address/new?from=%2Fpayment",
  );
  // 보낼 곳을 모르면 주문을 만들 수 없다
  agreeRequired();
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(true);
});

// 결제수단 목록은 토스 위젯이 그린다. 우리가 라디오를 만들지 않는다
test("결제 방법 자리를 토스 위젯이 채운다", () => {
  renderView();
  expect(screen.getByTestId("toss-widget")).toBeDefined();
});

// 결제는 되돌릴 수 없다. 필수 동의 없이 눌리면 무엇에 동의했는지 모르는 채로 돈이 나간다.
test("필수 약관에 동의해야 결제할 수 있다", () => {
  renderView();

  const pay = screen.getByRole("button", { name: /결제하기/ });
  expect(pay.hasAttribute("disabled")).toBe(true);

  agreeRequired();

  // 선택 항목은 켜지 않아도 결제할 수 있다
  expect(pay.hasAttribute("disabled")).toBe(false);
});

/**
 * 결제 버튼 한 번에 세 단계가 이어진다.
 *
 * **`[2]`에 가는 것은 숫자 PK, 결제창에 가는 것은 문자열 주문번호다.** 이름이 비슷해 섞이면
 * 위젯은 떠도 승인에서 막힌다.
 */
test("결제하기를 누르면 주문을 만들고 결제창을 띄운다", async () => {
  createOrder.mockResolvedValueOnce({ orderId: 77 });
  preparePayment.mockResolvedValueOnce({
    tossOrderId: "ORD-20260918-000123",
    amount: 12345,
    orderName: "종근당 캣츠벨",
    customerKey: "3f29a1d0",
  });
  renderView();

  agreeRequired();
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(requestPayment).toHaveBeenCalled());

  expect(createOrder).toHaveBeenCalledWith({
    addressId: HOME.addressId,
    // **서버가 필수로 받는다.** 빠지면 본문 검증에서 400이다. 기본 아이가 실린다 (#393)
    petId: 3,
    // **장바구니 규격이 아니라 주문 규격이다.** 서버가 상품과 타임딜을 다른 필드로
    // 받아, itemType·itemId를 그대로 보내면 매번 400이었다 (#306)
    items: [{ productId: 1, quantity: 1 }],
    // 드롭다운 기본값이 그대로 실린다
    deliveryNote: "문 앞에 놓아주세요",
  });
  expect(preparePayment).toHaveBeenCalledWith({ orderId: 77 });
  // **숫자 id도 함께 넘어간다.** 위젯이 그것을 복귀 주소에 실어, 결제가 끝난 뒤
  // 방금 산 주문으로 갈 수 있게 한다 (#301)
  expect(requestPayment).toHaveBeenCalledWith({
    tossOrderId: "ORD-20260918-000123",
    orderName: "종근당 캣츠벨",
    orderId: 77,
    // **서버가 만든 주문의 금액이다.** 화면이 장바구니로 센 값이 아니라 이쪽이 결제창에
    // 실려야 한다 — 둘이 갈린 채로 통과하면 승인에서 막힌다 (#312)
    amount: 12345,
  });
});

test("전체 동의를 켜면 네 줄이 함께 켜진다", () => {
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));

  // 이 저장소는 jest-dom을 붙이지 않아 toBeChecked가 없다. shadcn Checkbox의 상태로 본다
  expect(
    screen.getByLabelText("[선택] 다음 주문을 위해 이 결제 수단 저장").getAttribute("data-state"),
  ).toBe("checked");
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(false);
});

// 시안(paym_001_직접입력)은 직접 입력을 고른 뒤에만 칸을 연다
test("직접 입력을 고르기 전에는 입력 칸이 없다", () => {
  renderView();

  expect(screen.queryByLabelText("배송 요청사항 직접 입력")).toBeNull();
});

/**
 * 결제창이 뜬 뒤의 실패·취소는 토스가 `failUrl`로 되돌려 보내 `?code=`로 알 수 있지만,
 * 창을 띄우기도 전에 막히면 리다이렉트가 없다. 놓치면 눌러도 아무 일이 없어 보인다.
 */
test("주문을 만들지 못하면 실패를 알린다", async () => {
  createOrder.mockRejectedValueOnce(new Error("OUT_OF_STOCK"));
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() =>
    expect(toastAppError).toHaveBeenCalledWith("payment.failed", expect.any(Error)),
  );
  // 알리고 끝이 아니라 다시 누를 수 있어야 한다
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(false);
  expect(requestPayment).not.toHaveBeenCalled();
});

/**
 * 창을 띄우는 마지막 걸음에서 막히는 경우다. 주문은 이미 만들어졌고 결제창만 열리지 않았다.
 * `createOrder` 실패와 같은 `catch`로 떨어지지만 거기까지 가는 길이 달라 따로 본다.
 */
test("결제창을 띄우지 못하면 실패를 알린다", async () => {
  createOrder.mockResolvedValueOnce({ orderId: 77 });
  preparePayment.mockResolvedValueOnce({
    tossOrderId: "ORD-20260918-000123",
    amount: 12345,
    orderName: "종근당 캣츠벨",
    customerKey: "3f29a1d0",
  });
  requestPayment.mockRejectedValueOnce(new Error("INVALID_PARAMETERS"));
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(requestPayment).toHaveBeenCalled());
  await waitFor(() =>
    expect(toastAppError).toHaveBeenCalledWith("payment.failed", expect.any(Error)),
  );
  // 알리고 끝이 아니라 다시 누를 수 있어야 한다
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(false);
});

const PREPARED = {
  tossOrderId: "ORD-20260918-000123",
  amount: 12345,
  orderName: "종근당 캣츠벨",
  customerKey: "3f29a1d0",
};

/**
 * 실패한 뒤 다시 누르는 길이다.
 *
 * 처음부터 다시 가면 `PENDING` 주문이 누를 때마다 하나씩 쌓이고, 그것들이 주문 내역에
 * "결제 대기" 줄로 남는다 (#361). 같은 주문으로 결제 준비를 다시 부르는 것은 서버가
 * 받아 준다 — 중복 저장에서 기존 결제를 찾아 같은 `tossOrderId`를 돌려준다.
 */
test("결제가 실패한 뒤 다시 눌러도 주문을 또 만들지 않는다", async () => {
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  requestPayment.mockRejectedValueOnce(new Error("INVALID_PARAMETERS"));
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());

  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(requestPayment).toHaveBeenCalledTimes(2));

  expect(createOrder).toHaveBeenCalledTimes(1);
  // 결제 준비부터 다시 한다 — 만들어 둔 주문을 그대로 쓴다
  expect(preparePayment).toHaveBeenCalledTimes(2);
  expect(preparePayment).toHaveBeenLastCalledWith({ orderId: 77 });
});

// 옛 주문으로 결제하면 고친 내용이 반영되지 않는다. 본문이 달라지면 새로 만들어야 한다
test("요청사항을 고치면 주문을 새로 만든다", async () => {
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  requestPayment.mockRejectedValueOnce(new Error("INVALID_PARAMETERS"));
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect(createOrder).toHaveBeenCalledTimes(1);

  // 드롭다운을 직접 입력으로 바꾼다. 적은 것이 없으므로 요청사항이 `null`로 달라진다
  fireEvent.click(screen.getByLabelText("배송 요청사항"));
  fireEvent.click(screen.getByRole("option", { name: "직접 입력" }));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(2));
  expect(createOrder).toHaveBeenLastCalledWith({
    addressId: HOME.addressId,
    petId: 3,
    items: [{ productId: 1, quantity: 1 }],
    deliveryNote: null,
  });
});

// 서버가 `petId`를 필수로 받는다. 모르는 채로 누르면 본문 검증에서 400이다 (#393)
test("아이 목록을 알기 전에는 결제할 수 없다", () => {
  renderView({ petState: { pets: undefined, isLoading: true } });

  agreeRequired();

  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(true);
});

// 기본 아이를 바꾸고 돌아왔는데 옛 주문으로 결제하면 그 주문이 다른 아이 몫으로 남는다 (#393)
test("기본 아이가 바뀌면 주문을 새로 만든다", async () => {
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  requestPayment.mockRejectedValueOnce(new Error("USER_CANCEL"));

  const first = renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());

  first.unmount();
  renderView({
    petState: {
      pets: [
        { ...BORI, isDefault: true },
        { ...COCO, isDefault: false },
      ],
    },
  });
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(2));
  expect(createOrder).toHaveBeenLastCalledWith(expect.objectContaining({ petId: 7 }));
});

/**
 * 결제창에서 취소하고 돌아오는 길이다.
 *
 * 브라우저가 `failUrl`로 이동해 화면이 통째로 다시 선다. 만들어 둔 주문을 컴포넌트 상태로
 * 들고 있으면 그때 사라져서, 다시 누를 때 `PENDING` 주문을 하나 더 만든다 (#367).
 */
test("결제창에서 돌아와 다시 눌러도 주문을 또 만들지 않는다", async () => {
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  requestPayment.mockRejectedValueOnce(new Error("USER_CANCEL"));

  const first = renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect(createOrder).toHaveBeenCalledTimes(1);

  // 리다이렉트로 화면이 다시 서는 것을 흉내낸다
  first.unmount();
  renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(preparePayment).toHaveBeenCalledTimes(2));
  expect(createOrder).toHaveBeenCalledTimes(1);
  expect(preparePayment).toHaveBeenLastCalledWith({ orderId: 77 });
});

// 들고 있던 주문이 이미 결제됐거나 취소된 경우다. 비우지 않으면 눌러도 같은 자리에서 막힌다
/**
 * **서버가 주문을 셋으로 거른다** — 못 찾거나(404), 남의 것이거나(403), `PENDING`이 아니거나(409).
 *
 * 409만 보고 있던 동안 앞의 둘이 오면 저장소를 비우지 않아, 다시 눌러도 같은 자리에서 막혔다.
 * 탭을 닫기 전까지 결제할 수 없고 사용자는 그것을 알 길이 없다 (#388).
 */
test.each([
  ["PAYMENT_404_ORDER_NOT_FOUND", 404],
  ["PAYMENT_403_ORDER_OWNER_MISMATCH", 403],
])("%s가 오면 들고 있던 주문을 비운다", async (errorCode, status) => {
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  requestPayment.mockRejectedValueOnce(new Error("USER_CANCEL"));

  const first = renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());

  first.unmount();
  preparePayment.mockRejectedValueOnce(new ApiError(status, "거절", { errorCode } as never));
  const second = renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(preparePayment).toHaveBeenCalledTimes(2));

  // 비워졌으니 다음에는 새로 만든다
  second.unmount();
  createOrder.mockResolvedValue({ orderId: 88 });
  renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(2));
  expect(preparePayment).toHaveBeenLastCalledWith({ orderId: 88 });
});

/**
 * **잠깐 막힌 것까지 버리면 안 된다.** 다시 누를 때 주문이 하나 더 생긴다 — 그게 #361에서
 * 고친 문제다. 상태 코드로 뭉뚱그리지 않고 서버가 준 코드를 보는 이유다.
 */
test("잠깐 막힌 실패에서는 들고 있던 주문을 그대로 쓴다", async () => {
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  requestPayment.mockRejectedValueOnce(new Error("USER_CANCEL"));

  const first = renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());

  // 429는 4xx지만 주문이 잘못된 것이 아니다
  first.unmount();
  preparePayment.mockRejectedValueOnce(
    new ApiError(429, "잠시 후 다시 시도해 주세요", { errorCode: "COMMON_429" } as never),
  );
  const second = renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(preparePayment).toHaveBeenCalledTimes(2));

  // 그대로 들고 있으므로 주문을 또 만들지 않는다
  second.unmount();
  renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(preparePayment).toHaveBeenCalledTimes(3));
  expect(createOrder).toHaveBeenCalledTimes(1);
  expect(preparePayment).toHaveBeenLastCalledWith({ orderId: 77 });
});

test("들고 있던 주문을 서버가 거절하면 비우고 다음에 새로 만든다", async () => {
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  requestPayment.mockRejectedValueOnce(new Error("USER_CANCEL"));

  const first = renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());

  // 두 번째 — 들고 있던 주문으로 결제 준비를 부르는데 서버가 막는다
  first.unmount();
  preparePayment.mockRejectedValueOnce(
    new ApiError(409, "결제 가능한 상태의 주문이 아닙니다.", {
      errorCode: "PAYMENT_409_ORDER_NOT_PAYABLE",
    } as never),
  );
  const second = renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(preparePayment).toHaveBeenCalledTimes(2));

  // 세 번째 — 비워졌으니 주문을 새로 만든다
  second.unmount();
  createOrder.mockResolvedValue({ orderId: 88 });
  renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(2));
  expect(preparePayment).toHaveBeenLastCalledWith({ orderId: 88 });
});

// 살 수 없는 줄은 이름·금액이 `null`이라 셀 수도 주문에 실을 수도 없다
test("살 수 없는 줄만 남으면 결제할 수 없다", () => {
  const soldOut: CartItem = {
    ...ITEM,
    available: false,
    unavailableReason: "DEAL_ENDED",
    productName: null,
    subtotal: null,
  };
  renderView({ items: [soldOut] });

  expect(screen.getByText("결제할 상품이 없어요")).toBeDefined();
  agreeRequired();
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(true);
});

// 조회 중에 "없음" 쪽으로 그리면 목록이 도착하는 순간 문구와 목적지가 함께 바뀐다
test("배송지를 불러오는 동안에는 바꾸는 자리를 내걸지 않는다", () => {
  renderView({ addressState: { addresses: undefined, isLoading: true } });

  expect(screen.queryByRole("link", { name: "배송지 등록" })).toBeNull();
  expect(screen.queryByRole("link", { name: "배송지 변경" })).toBeNull();
});

// 조회 실패는 토스트가 아니라 화면이 직접 보여 준다. 사라지면 왜 비었는지 알 수 없다
test("배송지를 못 불러오면 화면이 알린다", () => {
  renderView({ addressState: { addresses: undefined, error: new Error("network") } });

  expect(screen.getByRole("alert")).toBeDefined();
});

/**
 * 결제창이 실패나 취소로 돌아오면 토스가 `?code=`를 붙여 되돌려 보낸다.
 * 놓치면 사용자는 눌러도 아무 일이 없었던 것처럼 보고 다시 누른다.
 */
test("결제창이 실패로 돌아오면 알린다", async () => {
  searchParams = new URLSearchParams("code=PAY_PROCESS_CANCELED");
  renderView();

  await waitFor(() =>
    expect(toastAppError).toHaveBeenCalledWith("payment.failed", "PAY_PROCESS_CANCELED"),
  );
});

// 평상시 진입에서 실패를 알리면 사용자가 하지도 않은 일로 놀란다
test("쿼리가 없으면 실패를 알리지 않는다", () => {
  renderView();

  expect(toastAppError).not.toHaveBeenCalled();
});

// 배송지를 등록하러 갔다 돌아올 때 고른 것을 잃으면 장바구니 전체로 읽혀 고르지 않은
// 상품까지 주문된다 (#364와 같은 자리다)
test("배송지 등록하러 갈 때 고른 상품을 들고 간다", () => {
  searchParams = new URLSearchParams("items=NORMAL:1");
  renderView({ addresses: [] });

  const href = screen.getByRole("link", { name: "배송지 등록" }).getAttribute("href");
  const from = new URLSearchParams(href!.split("?")[1]).get("from");
  expect(from).toBe("/payment?items=NORMAL%3A1");
});

// 장바구니가 고른 줄을 `?items=`로 넘긴다. 맞는 줄만 결제 대상이 된다
test("고른 줄만 결제 대상으로 센다", () => {
  searchParams = new URLSearchParams("items=NORMAL:1");
  renderView({
    items: [ITEM, { ...ITEM, itemId: 2, productName: "다른 상품", subtotal: 5000 }],
  });

  expect(screen.getByText("종근당 캣츠벨")).toBeDefined();
  expect(screen.queryByText("다른 상품")).toBeNull();
  // 고른 줄 9,345 + 배송비 3,000
  expect(screen.getByText("12,345원")).toBeDefined();
});
