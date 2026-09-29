// getCart 단위 테스트. 최근에 담은 줄이 맨 위로 오는지, 담은 시각이 같으면 받은 순서를 지키는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { getCart } from "./cart";

const row = (itemId: number, addedAt: string) => ({
  itemType: "NORMAL",
  itemId,
  quantity: 1,
  addedAt,
  available: true,
  unavailableReason: null,
  productName: `상품 ${itemId}`,
  thumbnailUrl: null,
  price: 1000,
  originalPrice: 1000,
  discountRate: 0,
  subtotal: 1000,
  dealEndAt: null,
});

function stubCart(items: ReturnType<typeof row>[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ memberId: 1, items, totalAmount: 0 })),
  );
}

afterEach(() => vi.unstubAllGlobals());

// 서버는 먼저 담은 순서로 준다(sever#170). 담자마자 장바구니로 오면 방금 담은 것이 위에 있어야 한다
test("최근에 담은 줄이 맨 위다", async () => {
  stubCart([
    row(1, "2026-09-29T01:00:00Z"),
    row(2, "2026-09-29T02:00:00.5Z"),
    row(3, "2026-09-29T03:00:00Z"),
  ]);

  const cart = await getCart();

  expect(cart.items.map((item) => item.itemId)).toEqual([3, 2, 1]);
});

// 예전 방식으로 저장된 줄은 서버가 1970년으로 채운다
test("담은 시각이 1970년인 옛 줄은 맨 아래로 간다", async () => {
  stubCart([row(1, "1970-01-01T00:00:00Z"), row(2, "2026-09-29T02:00:00Z")]);

  const cart = await getCart();

  expect(cart.items.map((item) => item.itemId)).toEqual([2, 1]);
});

// 옛 줄은 모두 1970년이라 시각으로는 가를 수 없다. 서버가 준 순서(키 순)를 지킨다
test("옛 줄끼리는 받은 순서 그대로 맨 아래에 남는다", async () => {
  const EPOCH = "1970-01-01T00:00:00Z";
  stubCart([row(2, EPOCH), row(1, EPOCH), row(4, "2026-09-29T02:00:00Z"), row(3, EPOCH)]);

  const cart = await getCart();

  expect(cart.items.map((item) => item.itemId)).toEqual([4, 2, 1, 3]);
});
