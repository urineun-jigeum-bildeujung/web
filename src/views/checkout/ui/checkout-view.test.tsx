// 결제하기 테스트. 금액 표시와 결제 잠금, 주문 생성부터 결제창까지의 순서를 본다.
//
// 조회는 가짜로 둔다. 무엇을 보내고 받은 것을 어떻게 다루는지는 `entities/cart`·
// `entities/address`·`entities/pet`이 본다.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ApiError } from "@/shared/api/client";
import { useEffect } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import type { CartItem } from "@/entities/cart";

import type { TossPaymentOrder } from "./toss-payment-widget";

const {
  requestPayment,
  toastAppError,
  showSnackbar,
  createOrder,
  releaseOrder,
  preparePayment,
  replace,
} = vi.hoisted(() => ({
  requestPayment: vi.fn(),
  toastAppError: vi.fn(),
  showSnackbar: vi.fn(),
  createOrder: vi.fn(),
  releaseOrder: vi.fn(),
  preparePayment: vi.fn(),
  replace: vi.fn(),
}));

const useQueryCart = vi.fn();
const useQueryAddresses = vi.fn();
const useQueryPets = vi.fn();
const useQueryBuyNowProduct = vi.fn();

vi.mock("@/shared/lib/app-toast", () => ({ toastAppError }));
vi.mock("@/shared/ui/snackbar/snackbar", () => ({ showSnackbar }));

/** 테스트마다 쿼리를 바꾼다. 결제창 복귀(`?code=`)와 고른 줄(`?items=`)이 여기로 들어온다 */
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace }),
  useSearchParams: () => searchParams,
}));

// `cartItemKey`는 화면과 `pickOrderItems`가 같은 규칙을 써야 하므로 진짜를 그대로 둔다
vi.mock("@/entities/cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/cart")>()),
  useQueryCart: () => useQueryCart(),
}));
// 조회 훅만 바꾸고 요청사항 칸(`DeliveryNoteField`)은 배송지 폼과 함께 쓰는 실제 것을 그린다 (#526)
vi.mock("@/entities/address", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/address")>()),
  useQueryAddresses: () => useQueryAddresses(),
}));
vi.mock("@/entities/pet", () => ({ useQueryPets: () => useQueryPets() }));
// 타임딜 줄의 상품 번호 조회. 링크 주소를 만드는 규칙은 `order-item-link.test.tsx`가 본다
const useQueryDealProductId = vi.fn();
vi.mock("@/entities/product", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/product")>()),
  useQueryDealProductId: (id: number | null) => useQueryDealProductId(id),
}));

vi.mock("../api/orders", () => ({ createOrder, releaseOrder }));
vi.mock("../api/use-query-buy-now-product", () => ({
  useQueryBuyNowProduct: (buyNow: unknown) => useQueryBuyNowProduct(buyNow),
}));
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

import { readPendingOrder } from "../model/pending-order";
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
  addedAt: "2026-09-29T01:00:00Z",
};

/** 조회가 끝나 배송지와 상품이 모두 있는 평상시 화면 */
function renderView({
  items = [ITEM],
  addresses = [HOME],
  cartState = {},
  addressState = {},
  petState = {},
  buyNowState = {},
}: {
  items?: CartItem[];
  addresses?: (typeof HOME)[];
  cartState?: Record<string, unknown>;
  addressState?: Record<string, unknown>;
  petState?: Record<string, unknown>;
  /** 바로 구매 상품 조회. `?buy=`가 없으면 화면이 쓰지 않는다 */
  buyNowState?: Record<string, unknown>;
} = {}) {
  useQueryBuyNowProduct.mockReturnValue({
    data: undefined,
    isPending: false,
    error: null,
    ...buyNowState,
  });
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

// 합계만 있으면 여러 상품 중 무엇이 얼마인지 알 수 없다 (QA No.46, #595)
test("상품 줄마다 주문 수량과 판매 금액을 보이고 이름은 두 줄까지 보인다", () => {
  const second: CartItem = {
    ...ITEM,
    itemId: 2,
    quantity: 2,
    productName: "로얄캐닌 인도어",
    price: 20000,
    subtotal: 40000,
  };
  renderView({ items: [ITEM, second] });

  const rows = screen.getAllByRole("listitem");
  expect(rows).toHaveLength(2);
  expect(rows[0].textContent).toContain("판매 금액9,345원");
  expect(rows[1].textContent).toContain("주문 수량2개");
  expect(rows[1].textContent).toContain("판매 금액40,000원");
  expect(screen.getByText("로얄캐닌 인도어").closest("p")?.className).toContain("line-clamp-2");
});

// 결제 화면에서 무엇을 사는지 다시 보려면 상세로 가야 한다 (QA No.47, #595)
test("상품 줄을 누르면 그 상품 상세로 간다", () => {
  renderView();

  const link = screen.getByRole("link", { name: "종근당 캣츠벨" });
  expect(link.getAttribute("href")).toBe("/products/1");
  // 이름만이 아니라 줄 전체를 덮는다
  expect(link.className).toContain("after:inset-0");
  expect(link.closest("li")?.className).toContain("relative");
});

// 서버가 배송 예정일을 주지 않아 화면이 한국 날짜로 모레를 센다 (QA No.45, #595)
test("살 상품이 있으면 결제 정보 맨 위에 도착 예정일을 알린다", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-30T01:00:00Z"));
  try {
    renderView();
    expect(screen.getByText("지금 주문하면 모레(10/2) 도착해요")).toBeDefined();
  } finally {
    vi.useRealTimers();
  }
});

test("살 상품이 없으면 도착 예정일을 알리지 않는다", () => {
  renderView({ items: [] });

  expect(screen.queryByText(/도착해요/)).toBeNull();
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

// 배송지 설정에서 고른 곳은 이번 주문에만 쓴다. 주소가 들고 다니고 기본 배송지는 그대로다 (QA No.40, #595)
test("배송지 설정에서 고른 곳이 있으면 기본 배송지 대신 그곳으로 주문한다", async () => {
  searchParams = new URLSearchParams({ items: "NORMAL:1", address: String(STUDIO.addressId) });
  createOrder.mockResolvedValue({ orderId: 77, orderStatus: "PENDING" });
  preparePayment.mockResolvedValue({ tossOrderId: "ORD-1", orderName: "캣츠벨", amount: 12345 });
  renderView({ addresses: [HOME, STUDIO] });

  expect(screen.getByText(`${STUDIO.address} ${STUDIO.addressDetail}`)).toBeDefined();
  // 배송지를 다시 바꾸러 갈 때 고른 상품과 고른 곳을 들고 간다
  expect(screen.getByRole("link", { name: "배송지 변경" }).getAttribute("href")).toBe(
    "/payment/address?items=NORMAL%3A1&address=9",
  );

  agreeRequired();
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));
  await waitFor(() => expect(createOrder).toHaveBeenCalled());
  expect(createOrder.mock.calls[0][0].addressId).toBe(STUDIO.addressId);
});

// 고른 곳을 그사이 지웠거나 주소창으로 고친 값이면 기본 배송지로 돌아간다
test("고른 배송지가 목록에 없으면 기본 배송지를 쓴다", () => {
  searchParams = new URLSearchParams({ address: "404" });
  renderView({ addresses: [STUDIO, HOME] });

  expect(screen.getByText(`${HOME.address} ${HOME.addressDetail}`)).toBeDefined();
});

// 시안 `empty_dilivery 2`. 고를 목록이 없으므로 설정이 아니라 등록으로 보낸다
test("등록된 배송지가 없으면 등록하러 보낸다", () => {
  renderView({ addresses: [] });

  expect(screen.getByText("아직 등록된 배송지가 없어요")).toBeDefined();
  // 시안(`2115:171079`)과 배송지 목록의 빈 상태와 같은 문구다 (#422)
  expect(screen.getByText("상품을 안전하게 받아보실 주소를 미리 등록해 주세요")).toBeDefined();
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

  expect(createOrder).toHaveBeenCalledWith(
    {
      addressId: HOME.addressId,
      // **서버가 필수로 받는다.** 빠지면 본문 검증에서 400이다. 기본 아이가 실린다 (#393)
      petId: 3,
      // **장바구니 규격이 아니라 주문 규격이다.** 서버가 상품과 타임딜을 다른 필드로
      // 받아, itemType·itemId를 그대로 보내면 매번 400이었다 (#306)
      items: [{ productId: 1, quantity: 1 }],
      // 드롭다운 기본값이 그대로 실린다
      deliveryNote: "문 앞에 놓아주세요",
    },
    // 생성 키. 응답을 잃고 다시 보낼 때 서버가 같은 요청으로 알아본다 (#412)
    expect.any(String),
  );
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

test("전체 동의를 켜면 필수 세 줄이 함께 켜진다", () => {
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));

  // 이 저장소는 jest-dom을 붙이지 않아 toBeChecked가 없다. shadcn Checkbox의 상태로 본다
  for (const label of [
    "[필수] 주문 상품 정보 동의",
    "[필수] 개인정보 제3자 제공 동의",
    "[필수] 결제 대행 서비스(PG) 이용 약관 동의",
  ]) {
    expect(screen.getByLabelText(label).getAttribute("data-state")).toBe("checked");
  }
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(false);
});

// 서버가 결제 수단을 저장하지 않아 체크해도 실리는 곳이 없었다. 백엔드 요청·PD 동의로 뺐다 (#466)
test("결제 수단 저장 줄이 없다", () => {
  renderView();

  expect(screen.queryByLabelText(/결제 수단 저장/)).toBeNull();
  expect(screen.queryByText(/결제 수단 저장/)).toBeNull();
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
  // 같은 주문을 다시 쓰므로 풀 것이 없다
  expect(releaseOrder).not.toHaveBeenCalled();
});

// 시안(1586:24254)이 목록 첫 보기에만 "[기본]"을 붙인다. 상자와 주문에 실리는 값은 원래 문구다 (#441)
test("요청사항 목록의 첫 보기에만 [기본]을 붙이고 상자에는 원래 문구를 보인다", async () => {
  renderView();

  const trigger = await screen.findByLabelText("배송 요청사항");
  expect(trigger.textContent).toBe("문 앞에 놓아주세요");

  fireEvent.click(trigger);
  expect(screen.getByRole("option", { name: "[기본] 문 앞에 놓아주세요" })).toBeDefined();
  expect(screen.getByRole("option", { name: "경비실에 맡겨주세요" })).toBeDefined();
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
  expect(createOrder).toHaveBeenLastCalledWith(
    {
      addressId: HOME.addressId,
      petId: 3,
      items: [{ productId: 1, quantity: 1 }],
      deliveryNote: null,
    },
    expect.any(String),
  );
  // **본문이 바뀌면 키도 새로 만든다.** 서버는 같은 키에 본문을 견주지 않고 처음 주문을
  // 돌려줘서, 키를 그대로 쓰면 고친 요청사항이 빠진 옛 주문이 온다 (#412)
  const [[, firstKey], [, secondKey]] = createOrder.mock.calls;
  expect(secondKey).not.toBe(firstKey);
  // 새로 만들기 전에 들고 있던 주문을 푼다. 두면 결제 대기로 남아 재고 예약을 쥔다 (#412)
  expect(releaseOrder).toHaveBeenCalledWith(77);
  expect(releaseOrder.mock.invocationCallOrder[0]).toBeLessThan(
    createOrder.mock.invocationCallOrder[1],
  );
});

/**
 * 같은 배송지의 주소를 고치고 돌아온 경우다.
 *
 * **서버는 주문을 만들 때 주소를 복사해 두고 바꾸지 않는다.** 배송지 id가 같다고 옛 주문을
 * 다시 쓰면 화면에는 새 주소가 보이는데 옛 주소로 결제·배송된다 (#412).
 */
test("배송지 주소를 고치면 주문을 새로 만든다", async () => {
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  requestPayment.mockRejectedValueOnce(new Error("USER_CANCEL"));

  const first = renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());

  // 배송지 변경에서 상세주소를 고치고 돌아온다. 배송지 id는 그대로다
  first.unmount();
  createOrder.mockResolvedValue({ orderId: 88 });
  renderView({ addresses: [{ ...HOME, addressDetail: "UI타워 5층 501호" }] });
  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(2));
  expect(preparePayment).toHaveBeenLastCalledWith({ orderId: 88 });
});

// 완료 화면은 리다이렉트로 새로 서서 어느 장바구니 줄을 샀는지 모른다. 주문과 함께 적어 둔다 (#457)
test("주문을 만들 때 그 장바구니 줄을 함께 적어 둔다", async () => {
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(requestPayment).toHaveBeenCalled());
  expect(readPendingOrder()?.cartItems).toEqual([{ itemType: "NORMAL", itemId: 1 }]);
});

/**
 * 서버가 주문을 만든 뒤 응답만 잃은 경우다(네트워크 끊김·게이트웨이 시간 초과).
 *
 * 새 키로 다시 보내면 서버가 같은 요청으로 못 알아봐 결제 대기 주문이 둘 된다. 같은 키로
 * 물으면 서버가 처음 만든 주문을 돌려준다 (#412).
 */
/** 상품 상세에서 바로 구매로 넘어온 상품. 결제 화면이 쓰는 값만 채운다 */
const BUY_NOW_PRODUCT = {
  productId: 252,
  name: "온스낵 오븐 쿠키 치즈 300g",
  images: ["https://image.test/cookie.png"],
  price: 8300,
};

// 전에는 바로 구매가 `/payment` 링크라 고른 상품 없이 왔다(QA PD-056, #520)
test("바로 구매로 오면 장바구니 대신 그 상품만 주문하고 장바구니 줄을 적지 않는다", async () => {
  searchParams = new URLSearchParams("buy=NORMAL:252:2");
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  // 장바구니에는 다른 상품이 있다. 이것까지 주문되면 안 된다
  renderView({ buyNowState: { data: BUY_NOW_PRODUCT } });

  expect(useQueryBuyNowProduct).toHaveBeenCalledWith({
    itemType: "NORMAL",
    itemId: 252,
    quantity: 2,
  });
  expect(screen.getByText("온스낵 오븐 쿠키 치즈 300g")).toBeDefined();
  expect(screen.getByText("2개")).toBeDefined();
  expect(screen.queryByText("종근당 캣츠벨")).toBeNull();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(requestPayment).toHaveBeenCalled());
  expect(createOrder).toHaveBeenCalledWith(
    expect.objectContaining({ items: [{ productId: 252, quantity: 2 }] }),
    expect.anything(),
  );
  // 장바구니에서 온 것이 아니라 결제가 끝나도 장바구니에서 빼지 않는다
  expect(readPendingOrder()?.cartItems).toEqual([]);
});

test("바로 구매 상품을 불러오는 동안에는 결제할 수 없다", () => {
  searchParams = new URLSearchParams("buy=NORMAL:252:1");
  renderView({ buyNowState: { isPending: true } });
  fireEvent.click(screen.getByLabelText("[전체 동의]"));

  expect(screen.queryByText("종근당 캣츠벨")).toBeNull();
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(true);
});

// 틀린 값을 없는 것으로 읽으면 장바구니 결제로 넘어가 고르지 않은 상품이 결제된다 (#521 리뷰)
test("바로 구매 값이 틀리면 장바구니로 넘어가지 않고 결제할 상품이 없다고 알린다", () => {
  searchParams = new URLSearchParams("buy=NORMAL:252:2:junk");
  renderView();
  fireEvent.click(screen.getByLabelText("[전체 동의]"));

  expect(screen.queryByText("종근당 캣츠벨")).toBeNull();
  expect(screen.getByText("결제할 상품이 없어요")).toBeDefined();
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(true);
});

// 상세에서 넘어온 뒤 품절됐거나 주소로 다시 들어온 경우다 (#521 리뷰)
test("바로 구매 상품이 품절이면 결제할 줄을 만들지 않는다", () => {
  searchParams = new URLSearchParams("buy=NORMAL:252:1");
  renderView({ buyNowState: { data: { ...BUY_NOW_PRODUCT, soldOut: true } } });
  fireEvent.click(screen.getByLabelText("[전체 동의]"));

  expect(screen.queryByText("온스낵 오븐 쿠키 치즈 300g")).toBeNull();
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(true);
});

test("주문 생성 응답을 잃고 다시 누르면 같은 키로 묻는다", async () => {
  createOrder
    .mockRejectedValueOnce(new TypeError("Failed to fetch"))
    .mockResolvedValueOnce({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(requestPayment).toHaveBeenCalled());
  const [[, firstKey], [, secondKey]] = createOrder.mock.calls;
  expect(secondKey).toBe(firstKey);
});

/**
 * 서버가 요청을 보고 거절한 경우다.
 *
 * **재고 부족은 주문을 저장한 뒤에 막힌다.** 그 주문은 취소된 채 키에 남아, 같은 키로 다시
 * 보내면 그 취소된 주문이 와서 결제 준비에서 또 막힌다 (#412).
 */
test("주문 생성을 서버가 거절하면 다음에는 새 키로 만든다", async () => {
  createOrder
    .mockRejectedValueOnce(
      new ApiError(409, "재고가 부족합니다.", {
        errorCode: "ORDER_409_INSUFFICIENT_STOCK",
      } as never),
    )
    .mockResolvedValueOnce({ orderId: 77 });
  preparePayment.mockResolvedValue(PREPARED);
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(2));
  const [[, firstKey], [, secondKey]] = createOrder.mock.calls;
  expect(secondKey).not.toBe(firstKey);
});

/**
 * 재고 서비스가 5xx로 막힌 경우다.
 *
 * 서버는 저장한 주문을 취소한 채 오류를 낸다. 5xx라 키를 들고 있다가 다시 누르면 같은 키로
 * 그 취소된 주문이 200으로 온다. 그 주문으로 결제를 준비하면 또 막혀 세 번째 누름에야
 * 결제됐다 (#442).
 */
test("같은 키로 취소된 주문이 오면 새 키로 다시 만들어 그 주문으로 결제한다", async () => {
  createOrder
    .mockRejectedValueOnce(
      new ApiError(503, "재고 서비스를 사용할 수 없습니다.", {
        errorCode: "ORDER_503_INVENTORY_SERVICE_UNAVAILABLE",
      } as never),
    )
    .mockResolvedValueOnce({ orderId: 77, orderStatus: "CANCELLED" })
    .mockResolvedValueOnce({ orderId: 78, orderStatus: "PENDING" });
  preparePayment.mockResolvedValue(PREPARED);
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(requestPayment).toHaveBeenCalled());
  expect(createOrder).toHaveBeenCalledTimes(3);
  const [[, firstKey], [, replayKey], [, freshKey]] = createOrder.mock.calls;
  // 두 번째 누름은 먼저 같은 키로 묻고, 취소된 주문을 받자 새 키로 만든다
  expect(replayKey).toBe(firstKey);
  expect(freshKey).not.toBe(firstKey);
  expect(preparePayment).toHaveBeenCalledTimes(1);
  expect(preparePayment).toHaveBeenCalledWith({ orderId: 78 });
  // 두 번째 누름은 실패 없이 결제창까지 간다
  expect(toastAppError).toHaveBeenCalledTimes(1);
});

// 결제된 주문을 같은 키로 받았는데 새로 만들면 두 번 결제될 수 있다. 결제 준비가 거르게 둔다
test("같은 키로 받은 주문이 취소가 아니면 새로 만들지 않는다", async () => {
  createOrder
    .mockRejectedValueOnce(new TypeError("Failed to fetch"))
    .mockResolvedValueOnce({ orderId: 77, orderStatus: "PAID" });
  preparePayment.mockRejectedValueOnce(
    new ApiError(409, "결제 가능한 상태의 주문이 아닙니다.", {
      errorCode: "PAYMENT_409_ORDER_NOT_PAYABLE",
    } as never),
  );
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(toastAppError).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalledTimes(2));
  expect(createOrder).toHaveBeenCalledTimes(2);
  expect(preparePayment).toHaveBeenCalledWith({ orderId: 77 });
  expect(requestPayment).not.toHaveBeenCalled();
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
  expect(createOrder).toHaveBeenLastCalledWith(
    expect.objectContaining({ petId: 7 }),
    expect.any(String),
  );
});

// 기본 아이를 정하지 않은 계정도 있다. 그때 버튼이 잠기면 결제할 길이 없다 (#394 리뷰)
test("기본 아이가 없으면 맨 앞 아이로 주문을 만든다", async () => {
  createOrder.mockResolvedValueOnce({ orderId: 77 });
  preparePayment.mockResolvedValueOnce(PREPARED);
  renderView({
    petState: {
      pets: [
        { ...COCO, isDefault: false },
        { ...BORI, isDefault: false },
      ],
    },
  });

  agreeRequired();
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
  expect(createOrder).toHaveBeenCalledWith(
    expect.objectContaining({ petId: 3 }),
    expect.any(String),
  );
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

/**
 * **알린 뒤에는 주소에서 실패 값을 걷는다.** 두면 배송지 변경에 갔다 뒤로 오거나 새로고침할
 * 때마다 같은 실패가 또 뜬다. 고른 상품은 남겨야 장바구니 전체로 읽히지 않는다 (#422)
 */
test("실패를 알린 뒤 주소에서 토스가 붙인 값을 걷고 고른 상품만 남긴다", async () => {
  searchParams = new URLSearchParams(
    "items=NORMAL%3A1&code=PAY_PROCESS_CANCELED&message=취소&orderId=ORD-1",
  );
  renderView();

  await waitFor(() =>
    expect(replace).toHaveBeenCalledWith("/payment?items=NORMAL%3A1", { scroll: false }),
  );
});

// 평상시 진입에서 실패를 알리면 사용자가 하지도 않은 일로 놀란다
test("쿼리가 없으면 실패를 알리지 않는다", () => {
  renderView();

  expect(toastAppError).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});

// 재고 부족처럼 서버가 이유를 알려 준 실패를 "결제 실패"로 뭉개면 다시 눌러도 같은 자리에서
// 막힌다. 그 문구를 그대로 보인다 (#422)
test("주문 생성이 재고 부족으로 막히면 재고 부족이라고 알린다", async () => {
  const outOfStock = new ApiError(409, "재고가 부족합니다.", {
    errorCode: "ORDER_409_INSUFFICIENT_STOCK",
  } as never);
  createOrder.mockRejectedValueOnce(outOfStock);
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalledWith("product.outOfStock", outOfStock));
});

// 상태 코드로만 떨어진 실패는 결제 맥락이 빠진 공통 문구라 "결제 실패"로 모은다
test("이유를 모르는 실패는 결제 실패로 알린다", async () => {
  const unknown = new ApiError(500, "서버 오류", { errorCode: "COMMON_500" } as never);
  createOrder.mockRejectedValueOnce(unknown);
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalledWith("payment.failed", unknown));
});

// 들고 있던 주문을 결제 준비가 못 찾은 경우다. 그 주문은 버렸으니 다시 누르면 결제된다.
// 주문 문구의 "주소가 바뀌었을 수 있어요"는 이 화면에 맞지 않는다 (#476)
test("결제 준비가 주문을 못 찾으면 결제 실패로 알린다", async () => {
  const notFound = new ApiError(404, "주문 없음", {
    errorCode: "PAYMENT_404_ORDER_NOT_FOUND",
  } as never);
  createOrder.mockResolvedValue({ orderId: 77 });
  preparePayment.mockRejectedValueOnce(notFound);
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalledWith("payment.failed", notFound));
});

// 없을 때 금액을 그리면 배송비만 더한 "결제금액 3,000원"이 "결제할 상품이 없어요" 옆에 뜬다 (#422)
test("결제할 상품이 없으면 금액 줄을 그리지 않는다", () => {
  renderView({ items: [] });

  expect(screen.getByText("결제할 상품이 없어요")).toBeDefined();
  expect(screen.queryByText("결제금액")).toBeNull();
  expect(screen.queryByText("3,000원")).toBeNull();
});

test("장바구니를 불러오는 동안에는 금액 줄을 그리지 않는다", () => {
  renderView({ cartState: { cart: undefined, isLoading: true } });

  expect(screen.queryByText("결제금액")).toBeNull();
});

/**
 * **`<dl>`의 자식 `<div>`는 `dt`·`dd`만 담을 수 있다.** 간격을 주려고 한 겹 더 감싸면 보조기기가
 * 이름과 값을 짝으로 읽지 못한다. `PaymentDetail`에서 #341로 고친 것과 같은 규칙이다 (#422)
 */
test("화면의 dl 아래에는 이름·값 짝만 온다", () => {
  const { container } = renderView();

  const lists = [...container.querySelectorAll("dl")];
  expect(lists.length).toBeGreaterThan(0);
  for (const list of lists) {
    for (const child of [...list.children]) {
      if (child.tagName === "DT" || child.tagName === "DD") {
        continue;
      }
      expect(child.tagName, `dl의 자식이 ${child.tagName}다`).toBe("DIV");
      expect(child.querySelector("div"), "짝 안에 div가 또 있다").toBeNull();
    }
  }
});

// 결제 화면이 사진을 읽지 않아 장바구니·주문 완료와 달리 늘 회색 칸이었다 (#422)
test("상품 사진이 있으면 보인다", () => {
  const { container } = renderView({
    items: [{ ...ITEM, thumbnailUrl: "https://cdn.test/cat.png" }],
  });

  expect(container.querySelector('img[src*="cat.png"]')).not.toBeNull();
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

/** 장바구니를 떠난 뒤 품절된 줄. 상품은 있어 이름·금액이 그대로 온다(`unavailableWithInfo`) */
const SOLD_OUT: CartItem = {
  ...ITEM,
  itemId: 2,
  productName: "품절된 상품",
  available: false,
  unavailableReason: "OUT_OF_STOCK",
};

// 고른 상품이 결제 화면에 오기 전에 품절되면 조용히 빠져 금액만 줄었다 (QA No.20, #591)
test("고른 줄이 품절돼 빠졌으면 한 번 알린다", () => {
  searchParams = new URLSearchParams("items=NORMAL:1,NORMAL:2");
  const { rerender } = renderView({ items: [ITEM, SOLD_OUT] });

  expect(screen.queryByText("품절된 상품")).toBeNull();
  expect(showSnackbar).toHaveBeenCalledExactlyOnceWith("품절된 상품은 제외했어요");

  // 창 포커스 등으로 장바구니를 다시 받아도 같은 화면에서 또 뜨지 않는다
  useQueryCart.mockReturnValue({
    cart: { memberId: 1, items: [{ ...ITEM }, { ...SOLD_OUT }], totalAmount: 9345 },
    isLoading: false,
    error: null,
  });
  rerender(<CheckoutView />);
  expect(showSnackbar).toHaveBeenCalledTimes(1);
});

test("같은 화면에서 품절이 풀렸다가 다시 품절돼도 한 번만 알린다", () => {
  searchParams = new URLSearchParams("items=NORMAL:1,NORMAL:2");
  const { rerender } = renderView({ items: [ITEM, SOLD_OUT] });
  expect(showSnackbar).toHaveBeenCalledTimes(1);

  // 다시 받았더니 재입고됐다
  useQueryCart.mockReturnValue({
    cart: {
      memberId: 1,
      items: [{ ...ITEM }, { ...SOLD_OUT, available: true }],
      totalAmount: 9345,
    },
    isLoading: false,
    error: null,
  });
  rerender(<CheckoutView />);

  // 또 받았더니 다시 품절이다
  useQueryCart.mockReturnValue({
    cart: { memberId: 1, items: [{ ...ITEM }, { ...SOLD_OUT }], totalAmount: 9345 },
    isLoading: false,
    error: null,
  });
  rerender(<CheckoutView />);
  expect(showSnackbar).toHaveBeenCalledTimes(1);
});

test("고른 줄이 모두 살 수 있거나 고르지 않은 줄만 품절이면 알리지 않는다", () => {
  searchParams = new URLSearchParams("items=NORMAL:1");
  renderView({ items: [ITEM, SOLD_OUT] });

  expect(showSnackbar).not.toHaveBeenCalled();
});

/** 뒤로·앞으로 캐시에서 되살아난 것처럼 `pageshow`를 쏜다 */
function firePageShow(persisted: boolean) {
  const event = new Event("pageshow");
  Object.defineProperty(event, "persisted", { value: persisted });
  act(() => {
    window.dispatchEvent(event);
  });
}

/**
 * **결제창에서 기기 뒤로가기로 돌아온 경우다.** iOS Safari 같은 브라우저는 이 화면을 상태째
 * 되살린다. 결제창 약속은 끝나지 않아 되돌림이 돌지 않고, 버튼이 대기로 굳었다 (#430)
 */
test("결제창에서 캐시로 되살아나 돌아오면 결제 버튼을 다시 누를 수 있다", async () => {
  createOrder.mockResolvedValueOnce({ orderId: 77 });
  preparePayment.mockResolvedValueOnce(PREPARED);
  // 결제창으로 떠나 돌아오지 않는다
  requestPayment.mockImplementationOnce(() => new Promise<void>(() => {}));
  renderView();

  fireEvent.click(screen.getByLabelText("[전체 동의]"));
  fireEvent.click(screen.getByRole("button", { name: /결제하기/ }));
  await waitFor(() => expect(requestPayment).toHaveBeenCalled());
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(true);

  // 처음 불러온 것이면 그대로 둔다
  firePageShow(false);
  expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(true);

  firePageShow(true);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /결제하기/ }).hasAttribute("disabled")).toBe(false),
  );
});
