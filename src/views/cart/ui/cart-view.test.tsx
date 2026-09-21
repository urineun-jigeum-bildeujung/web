// 무엇이 합계에 들어가는지, 고른 것이 없을 때 무엇이 보이지 않는지 확인한다.
//
// **목이 서버처럼 상태를 든다.** 수량 변경은 낙관적으로 먼저 그린 뒤 다시 조회해 맞추는데,
// 목이 늘 같은 값을 돌려주면 그 조회가 방금 바꾼 것을 되돌려 통과 여부가 뒤집힌다.
// 목을 고쳐 쓰게 해 두면 `delta`가 제대로 더해지는지까지 함께 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCart, changeCartItemQuantity, removeCartItem } = vi.hoisted(() => ({
  getCart: vi.fn(),
  changeCartItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

// `cartItemKey`는 화면과 훅이 같은 규칙을 써야 하므로 진짜를 그대로 둔다
vi.mock("@/entities/cart/api/cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/cart/api/cart")>()),
  getCart,
  changeCartItemQuantity,
  removeCartItem,
}));

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import type { Cart, CartItem, CartItemRef } from "@/entities/cart";
import { CartView } from "./cart-view";

// 살 수 없는 줄은 이름과 금액이 `null`로 오므로 그 타입을 그대로 받는다
function makeItem(
  itemId: number,
  productName: string | null,
  price: number | null,
  over: Partial<CartItem> = {},
): CartItem {
  return {
    itemType: "NORMAL",
    itemId,
    quantity: 1,
    available: true,
    unavailableReason: null,
    productName,
    thumbnailUrl: null,
    price,
    originalPrice: null,
    discountRate: null,
    subtotal: price,
    dealEndAt: null,
    ...over,
  };
}

const ITEMS = [
  makeItem(1, "유산균", 19900),
  makeItem(2, "우피껌", 8000),
  makeItem(3, "한우스틱", 3900),
];

/** 서버가 들고 있는 것. 목이 이것을 읽고 고친다 */
let stored: CartItem[] = [];

function isSame(row: CartItem, ref: CartItemRef) {
  return row.itemType === ref.itemType && row.itemId === ref.itemId;
}

beforeEach(() => {
  vi.clearAllMocks();

  getCart.mockImplementation(async (): Promise<Cart> => ({
    memberId: 1,
    items: stored.map((row) => ({ ...row })),
    totalAmount: stored.reduce((sum, row) => sum + (row.price ?? 0) * row.quantity, 0),
  }));

  // 명세가 약속하는 것은 `200 OK`뿐이라 목도 아무것도 돌려주지 않는다
  changeCartItemQuantity.mockImplementation(async (ref: CartItemRef, delta: number) => {
    const row = stored.find((item) => isSame(item, ref));
    if (row) {
      row.quantity += delta;
    }
  });

  removeCartItem.mockImplementation(async (ref: CartItemRef) => {
    stored = stored.filter((item) => !isSame(item, ref));
  });
});

function renderCart(items: CartItem[] = ITEMS) {
  stored = items.map((item) => ({ ...item }));
  return render(<CartView />, { wrapper: createQueryWrapper() });
}

describe("CartView", () => {
  // 시안은 아무것도 고르지 않은 상태로 시작한다
  it("처음에는 아무것도 고르지 않은 상태다", async () => {
    renderCart();

    expect(await screen.findByText("전체선택 (0/3)")).toBeDefined();
    expect(screen.getByRole("button", { name: "결제하기" })).toHaveProperty("disabled", true);
  });

  // 0원만 늘어놓아도 알려주는 것이 없고, 고르라는 신호가 흐려진다
  it("고른 것이 없으면 금액 줄을 아예 보여주지 않는다", async () => {
    renderCart();
    await screen.findByText("전체선택 (0/3)");

    expect(screen.queryByText("결제금액")).toBeNull();
    expect(screen.queryByText("판매가격")).toBeNull();
    expect(screen.queryByText("배송비")).toBeNull();
  });

  it("고른 상품만 합계에 들어간다", async () => {
    renderCart();

    fireEvent.click(await screen.findByLabelText("유산균 고르기"));

    // 19,900 + 배송비 3,000
    expect(screen.getByText("22,900원")).toBeDefined();

    fireEvent.click(screen.getByLabelText("우피껌 고르기"));

    // 19,900 + 8,000 + 3,000
    expect(screen.getByText("30,900원")).toBeDefined();
  });

  it("전체선택으로 한 번에 고르고 푼다", async () => {
    renderCart();

    fireEvent.click(await screen.findByLabelText("전체선택 (0/3)"));
    expect(screen.getByText("전체선택 (3/3)")).toBeDefined();

    // 19,900 + 8,000 + 3,900 + 3,000
    expect(screen.getByText("34,800원")).toBeDefined();
  });

  // 서버는 바뀐 값이 아니라 증감을 받는다. 스테퍼 값을 그대로 보내면 수량이 엉뚱하게 쌓인다
  it("수량을 올리면 증감으로 보내고 합계도 함께 오른다", async () => {
    renderCart();

    fireEvent.click(await screen.findByLabelText("유산균 고르기"));
    fireEvent.click(screen.getByLabelText("유산균 수량 하나 늘리기"));

    // `onMutate`가 진행 중인 조회를 세우고 나서야 요청이 나간다. 클릭 직후에는 아직 안 불렸다
    await waitFor(() =>
      expect(changeCartItemQuantity).toHaveBeenCalledWith(
        expect.objectContaining({ itemId: 1 }),
        1,
      ),
    );
    // 19,900 × 2 + 3,000
    expect(await screen.findByText("42,800원")).toBeDefined();
  });

  it("상품을 빼면 목록과 합계에서 모두 사라진다", async () => {
    renderCart();

    fireEvent.click(await screen.findByLabelText("유산균 고르기"));
    fireEvent.click(screen.getByLabelText("유산균 빼기"));
    fireEvent.click(screen.getByRole("button", { name: "상품 빼기" }));

    await waitFor(() => expect(screen.queryByLabelText("유산균 고르기")).toBeNull());
    expect(screen.getByText("전체선택 (0/2)")).toBeDefined();
  });

  // 목데이터가 늘 차 있어 빈 상태가 화면에서 도달하지 않았다. 조회 결과를 받도록 바꿔 덮는다
  it("담은 것이 없으면 비었다고 알린다", async () => {
    renderCart([]);

    expect(await screen.findByText("장바구니가 비어 있어요")).toBeDefined();
    expect(screen.queryByText(/전체선택/)).toBeNull();
  });

  // 이름이 안 오는 경우다(`unavailableWithoutInfo`). 고를 수 없어야 결제 합계가 맞는다
  it("이름이 없는 줄은 까닭이 이름 자리에 선다", async () => {
    renderCart([
      makeItem(1, "유산균", 19900),
      makeItem(9, null, null, {
        itemType: "TIME_DEAL",
        available: false,
        unavailableReason: "DEAL_ENDED",
        subtotal: null,
      }),
    ]);

    // 이름이 오지 않으므로 그 자리를 까닭이 대신한다. 없는 이름을 지어내지 않는다
    expect(await screen.findByText("타임딜이 끝났어요")).toBeDefined();
    // 셀 수 있는 것은 살 수 있는 한 줄뿐이다
    expect(screen.getByText("전체선택 (0/1)")).toBeDefined();
    expect(screen.getByLabelText("타임딜이 끝났어요 고르기")).toHaveProperty("disabled", true);
    // 금액도 수량도 뜻이 없어 아랫줄은 비운다
    expect(screen.queryByLabelText("타임딜이 끝났어요 수량")).toBeNull();
  });

  /**
   * **이름이 오는 경우가 따로 있다.**
   *
   * 서버 `unavailableWithInfo`가 상품은 있는데 못 사는 경우(`OUT_OF_STOCK`·`DISCONTINUED`·
   * `DEAL_ENDED`) 이름·사진·가격을 그대로 준다. 이름을 까닭으로 덮어쓰던 동안 그 셋은 까닭이
   * 아예 보이지 않아, 살 수 없는 줄이 멀쩡한 상품처럼 보였다 (#318).
   */
  it("이름이 오는 줄은 이름 아래에 까닭을 둔다", async () => {
    renderCart([
      makeItem(3, "관절 영양제", 24000, {
        available: false,
        unavailableReason: "OUT_OF_STOCK",
        subtotal: null,
      }),
    ]);

    expect(await screen.findByText("관절 영양제")).toBeDefined();
    expect(screen.getByText("품절됐어요")).toBeDefined();
    // 고를 수도, 수량을 만질 수도 없다
    expect(screen.getByLabelText("관절 영양제 고르기")).toHaveProperty("disabled", true);
    expect(screen.queryByLabelText("관절 영양제 수량")).toBeNull();
  });

  // 다섯을 백엔드 소스에서 확인했다. 명세에는 하나만 적혀 있었다 (#318)
  it("서버가 주는 다섯 까닭을 모두 사람이 읽는 문구로 바꾼다", async () => {
    const REASONS = [
      ["NOT_FOUND", "더 이상 없는 상품이에요"],
      ["TEMPORARILY_UNAVAILABLE", "지금은 확인할 수 없어요"],
      ["DEAL_ENDED", "타임딜이 끝났어요"],
      ["OUT_OF_STOCK", "품절됐어요"],
      ["DISCONTINUED", "판매가 끝났어요"],
    ] as const;

    renderCart(
      REASONS.map(([code], index) =>
        makeItem(index + 1, null, null, {
          available: false,
          unavailableReason: code,
          subtotal: null,
        }),
      ),
    );

    for (const [, text] of REASONS) {
      expect(await screen.findByText(text)).toBeDefined();
    }
  });
});
