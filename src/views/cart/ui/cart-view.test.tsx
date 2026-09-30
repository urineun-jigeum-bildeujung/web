// 무엇이 합계에 들어가는지, 고른 것이 없을 때 무엇이 보이지 않는지 확인한다.
//
// **목이 서버처럼 상태를 든다.** 수량 변경은 낙관적으로 먼저 그린 뒤 다시 조회해 맞추는데,
// 목이 늘 같은 값을 돌려주면 그 조회가 방금 바꾼 것을 되돌려 통과 여부가 뒤집힌다.
// 목을 고쳐 쓰게 해 두면 `delta`가 제대로 더해지는지까지 함께 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCart, changeCartItemQuantity, removeCartItem, getTimeDealDetail } = vi.hoisted(() => ({
  getCart: vi.fn(),
  changeCartItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
  getTimeDealDetail: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

// 타임딜 줄의 상품 번호는 딜 상세에서 받는다(장바구니 응답에 없다, #563)
vi.mock("@/entities/product", () => ({ getTimeDealDetail }));

// `cartItemKey`는 화면과 훅이 같은 규칙을 써야 하므로 진짜를 그대로 둔다
vi.mock("@/entities/cart/api/cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/cart/api/cart")>()),
  getCart,
  changeCartItemQuantity,
  removeCartItem,
}));

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import type { Cart, CartItem, CartItemRef } from "@/entities/cart";
import { useCartSelectionStore } from "../model/cart-selection-store";
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
    addedAt: "2026-09-29T01:00:00Z",
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
  // 고른 줄은 브라우저에 남는다. 앞 테스트가 고른 것이 다음 테스트에 새지 않게 비운다
  useCartSelectionStore.setState({ keys: [] });
  localStorage.clear();

  getTimeDealDetail.mockResolvedValue({ productId: 42, name: "딜 상품" });

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
  });

  // 상품을 담으면 무엇을 할 수 있는지 미리 보이게 PD팀이 일부러 남겼다 (2026-09-28, #448)
  it("비었어도 전체선택과 결제하기를 잠근 채 남긴다", async () => {
    renderCart([]);

    await screen.findByText("장바구니가 비어 있어요");
    expect(screen.getByText("전체선택 (0/0)")).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "전체선택 (0/0)" }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: "결제하기" }).hasAttribute("disabled")).toBe(true);
    // 고른 것이 없으니 금액 줄은 없다
    expect(screen.queryByText("결제금액")).toBeNull();
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

/** 줄 체크박스가 골라져 있는가. Radix 체크박스는 상태를 `aria-checked`로 낸다 */
function isChecked(label: string) {
  return screen.getByRole("checkbox", { name: label }).getAttribute("aria-checked") === "true";
}

// PM QA 시트 "이슈&블로커"의 장바구니 항목 (#563)
describe("CartView QA", () => {
  it("빈 장바구니의 상품 둘러보기는 메인으로 간다 (No.7)", async () => {
    renderCart([]);

    const browse = await screen.findByRole("link", { name: "상품 둘러보기" });
    expect(browse.getAttribute("href")).toBe("/");
  });

  // 결제 화면에 갔다 뒤로 오면 화면이 다시 마운트된다. 그때 `0/9`로 풀렸다
  it("다시 들어와도 고른 줄이 그대로다 (No.23·24)", async () => {
    const first = renderCart();
    fireEvent.click(await screen.findByLabelText("유산균 고르기"));
    fireEvent.click(screen.getByLabelText("우피껌 고르기"));
    first.unmount();

    renderCart();

    expect(await screen.findByText("전체선택 (2/3)")).toBeDefined();
    expect(isChecked("유산균 고르기")).toBe(true);
    expect(isChecked("우피껌 고르기")).toBe(true);
    expect(isChecked("한우스틱 고르기")).toBe(false);
  });

  /**
   * **남겨 둔 키는 지금 살 수 있는 줄과 겹치는 것만 쓴다.** 그사이 품절된 줄이 골라진 채로 남으면
   * 결제로 넘어가고, 빠진 줄의 키가 개수에 섞이면 `3/2`처럼 셈이 어긋난다.
   */
  it("그사이 못 사게 된 줄과 빠진 줄은 고른 것으로 보지 않고, 다음에 고를 때 걷는다", async () => {
    useCartSelectionStore.setState({ keys: ["NORMAL:1", "NORMAL:3", "NORMAL:99"] });
    renderCart([
      makeItem(1, "유산균", 19900),
      makeItem(2, "우피껌", 8000),
      makeItem(3, "한우스틱", 3900, {
        available: false,
        unavailableReason: "OUT_OF_STOCK",
        subtotal: null,
      }),
    ]);

    expect(await screen.findByText("전체선택 (1/2)")).toBeDefined();
    expect(isChecked("유산균 고르기")).toBe(true);
    expect(isChecked("한우스틱 고르기")).toBe(false);
    expect(screen.getByRole("link", { name: "결제하기" }).getAttribute("href")).toBe(
      "/payment?items=NORMAL:1",
    );

    fireEvent.click(screen.getByLabelText("우피껌 고르기"));

    expect(useCartSelectionStore.getState().keys).toEqual(["NORMAL:1", "NORMAL:2"]);
  });

  // 남겨 두면 같은 상품을 다시 담았을 때 골라진 채로 보인다
  it("뺀 줄은 고른 목록에서도 뺀다", async () => {
    renderCart();

    fireEvent.click(await screen.findByLabelText("유산균 고르기"));
    fireEvent.click(screen.getByLabelText("우피껌 고르기"));
    fireEvent.click(screen.getByLabelText("유산균 빼기"));
    fireEvent.click(screen.getByRole("button", { name: "상품 빼기" }));

    expect(useCartSelectionStore.getState().keys).toEqual(["NORMAL:2"]);
  });

  it("전체선택을 누르면 살 수 있는 줄이 모두 골라진다 (No.2)", async () => {
    renderCart();

    fireEvent.click(await screen.findByLabelText("전체선택 (0/3)"));

    expect(screen.getByText("전체선택 (3/3)")).toBeDefined();
    for (const name of ["유산균", "우피껌", "한우스틱"]) {
      expect(isChecked(`${name} 고르기`)).toBe(true);
    }
  });

  // 일반 줄은 줄 번호가 곧 상품 번호다. 이름뿐 아니라 줄 어디를 눌러도 가도록 링크가 줄을 덮는다
  it("일반 줄은 그 상품의 상세로 간다 (No.9)", async () => {
    renderCart();

    const link = await screen.findByRole("link", { name: "유산균" });
    expect(link.getAttribute("href")).toBe("/products/1");
    expect(getTimeDealDetail).not.toHaveBeenCalled();
  });

  // 장바구니 응답에는 딜 아이템 번호만 온다. 딜가로 보이려면 `?dealItem=`이 붙어야 한다(#484)
  it("타임딜 줄은 딜 상세에서 받은 상품 번호로 딜가 상세에 간다 (No.9)", async () => {
    renderCart([makeItem(5, "딜 사료", 12000, { itemType: "TIME_DEAL" })]);

    const link = await screen.findByRole("link", { name: "딜 사료" });
    expect(link.getAttribute("href")).toBe("/products/42?dealItem=5");
    expect(getTimeDealDetail).toHaveBeenCalledWith("5");
  });

  // 끝난 딜은 딜 상세가 404다. 엉뚱한 상품으로 보내느니 링크를 걸지 않는다
  it("상품 번호를 모르는 줄은 링크를 걸지 않는다", async () => {
    getTimeDealDetail.mockRejectedValue(new Error("404"));
    renderCart([
      makeItem(5, "끝난 딜", 12000, {
        itemType: "TIME_DEAL",
        available: false,
        unavailableReason: "DEAL_ENDED",
        subtotal: null,
      }),
      makeItem(9, null, null, {
        available: false,
        unavailableReason: "NOT_FOUND",
        subtotal: null,
      }),
    ]);

    expect(await screen.findByText("끝난 딜")).toBeDefined();
    await waitFor(() => expect(getTimeDealDetail).toHaveBeenCalledWith("5"));
    expect(screen.queryByRole("link", { name: "끝난 딜" })).toBeNull();
    // 이름이 안 오는 줄은 갈 상세가 없어 부르지도 않는다
    expect(screen.queryByRole("link", { name: "더 이상 없는 상품이에요" })).toBeNull();
    expect(getTimeDealDetail).toHaveBeenCalledTimes(1);
  });

  it("할인 상품이면 할인율과 정가 취소선을 함께 보인다 (No.10)", async () => {
    renderCart([
      makeItem(1, "유산균", 17500, { originalPrice: 25000, discountRate: 30 }),
      // 할인이 없는 줄도 정가가 판매가와 같은 값으로 온다
      makeItem(2, "우피껌", 8000, { originalPrice: 8000, discountRate: 0 }),
    ]);

    expect(await screen.findByText("30%")).toBeDefined();
    expect(screen.getByText("25,000원").className).toContain("line-through");
    // 할인 없는 줄에는 할인율도 취소선도 없다 — 취소선은 할인 줄의 정가 하나뿐이다
    expect(screen.queryByText("0%")).toBeNull();
    expect(document.querySelectorAll(".line-through")).toHaveLength(1);
  });

  it("품절 줄은 사진에 품절 표시를 얹고 흐린다 (No.21)", async () => {
    renderCart([
      makeItem(1, "유산균", 19900, { thumbnailUrl: "https://cdn.test/a.png" }),
      makeItem(3, "한우스틱", 3900, {
        thumbnailUrl: "https://cdn.test/b.png",
        available: false,
        unavailableReason: "OUT_OF_STOCK",
        subtotal: null,
      }),
    ]);

    await screen.findByText("한우스틱");
    const [sellableImage, soldOutImage] = document.querySelectorAll("li img");
    expect(soldOutImage.className).toContain("opacity-50");
    expect(sellableImage.className).not.toContain("opacity-50");
    // 표시는 품절 줄 하나에만 붙는다. 까닭 글("품절됐어요")과는 다른 요소다
    expect(screen.getAllByText("품절")).toHaveLength(1);
  });

  // 살 수 있는 줄이 없으면 고를 것도 결제할 것도 없다
  it("모두 품절이면 전체선택과 결제하기가 잠긴다 (No.21)", async () => {
    renderCart([
      makeItem(3, "한우스틱", 3900, {
        available: false,
        unavailableReason: "OUT_OF_STOCK",
        subtotal: null,
      }),
    ]);

    expect(await screen.findByText("전체선택 (0/0)")).toBeDefined();
    expect(screen.getByText("품절")).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "전체선택 (0/0)" }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: "결제하기" }).hasAttribute("disabled")).toBe(true);
  });
});
