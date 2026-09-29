// 상세가 타임딜에서 들어왔을 때 타임딜 상세를 받고, 못 쓸 딜이면 일반 상세로 두는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { getDetailProduct } from "./detail-product";

const detail = (productId: number, price: number, timeDealItemId: number | null) => ({
  productId,
  timeDealItemId,
  summary: {
    images: [],
    productName: `상품 ${productId}`,
    price,
    originalPrice: 32000,
    discountRate: 25,
    avgRating: null,
    reviewCount: 0,
    soldOut: false,
  },
  detailInfo: {},
});

const notFound = () =>
  Response.json({ errorCode: "PRODUCT_404_TIME_DEAL_ITEM_NOT_FOUND" }, { status: 404 });

/** 부른 경로마다 정해 둔 응답을 준다. 무엇을 불렀는지도 남긴다 */
function stubRoutes(routes: Record<string, () => Response>) {
  const fetchMock = vi.fn((url: string) => {
    const route = routes[url];
    return Promise.resolve(route ? route() : Response.json({}, { status: 500 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

test("딜 번호 없이 들어오면 일반 상품 상세다", async () => {
  const fetchMock = stubRoutes({
    "/api/v1/products/101": () => Response.json(detail(101, 32000, null)),
  });

  const product = await getDetailProduct("101");

  expect(product?.price).toBe(32000);
  expect(product?.timeDealItemId).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

// 일반 상세는 딜 중인 상품에도 정가와 빈 딜 번호를 준다. 정가로 보이고 정가로 담기던 자리다
test("타임딜에서 들어오면 딜가와 딜 번호가 붙은 타임딜 상세를 받는다", async () => {
  const fetchMock = stubRoutes({
    "/api/v1/time-deals/items/1": () => Response.json(detail(101, 24000, 1)),
  });

  const product = await getDetailProduct("101", "1");

  expect(product?.price).toBe(24000);
  expect(product?.timeDealItemId).toBe(1);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("끝난 딜이면 일반 상세로 둔다", async () => {
  stubRoutes({
    "/api/v1/time-deals/items/1": notFound,
    "/api/v1/products/101": () => Response.json(detail(101, 32000, null)),
  });

  const product = await getDetailProduct("101", "1");

  expect(product?.price).toBe(32000);
  expect(product?.timeDealItemId).toBeNull();
});

// 주소를 손으로 고치거나 오래된 링크면 딜 번호가 다른 상품을 가리킬 수 있다
test("다른 상품의 딜이면 그 딜가를 붙이지 않고 일반 상세로 둔다", async () => {
  stubRoutes({
    "/api/v1/time-deals/items/2": () => Response.json(detail(202, 9000, 2)),
    "/api/v1/products/101": () => Response.json(detail(101, 32000, null)),
  });

  const product = await getDetailProduct("101", "2");

  expect(product?.productId).toBe(101);
  expect(product?.price).toBe(32000);
});

/** 새 응답(sever#170)의 딜 정보. 딜 번호는 여기서만 온다 */
const withTimeDeal = (purchasable: boolean, soldOut = false) => ({
  ...detail(101, 24000, null),
  timeDealItemId: undefined,
  timeDeal: {
    timeDealItemId: 1,
    dealId: 1,
    dealStatus: "ACTIVE",
    startAt: "2026-09-29T00:00:00+09:00",
    endAt: "2026-09-29T12:00:00+09:00",
    serverTime: "2026-09-29T12:00:01+09:00",
    purchasable,
  },
  summary: { ...detail(101, 24000, null).summary, soldOut },
});

// 종료 시각이 지났는데 아직 ENDED로 넘어가지 않은 딜은 200을 준다. 딜가로 담기면 서버가 거절한다(QA PD-064)
test("서버가 살 수 없다고 한 딜이면 일반 상세로 둔다", async () => {
  stubRoutes({
    "/api/v1/time-deals/items/1": () => Response.json(withTimeDeal(false)),
    "/api/v1/products/101": () => Response.json(detail(101, 32000, null)),
  });

  const product = await getDetailProduct("101", "1");

  expect(product?.price).toBe(32000);
  expect(product?.timeDealItemId).toBeNull();
});

// 딜 재고가 떨어진 딜은 살 수 없어도 딜 상세로 둔다. 화면이 딜 품절로 그린다(QA PD-067)
test("딜 재고가 떨어진 딜은 딜 상세로 둔다", async () => {
  const fetchMock = stubRoutes({
    "/api/v1/time-deals/items/1": () => Response.json(withTimeDeal(false, true)),
  });

  const product = await getDetailProduct("101", "1");

  expect(product?.timeDealItemId).toBe(1);
  expect(product?.soldOut).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("지금 살 수 있는 딜이면 딜 상세다", async () => {
  const fetchMock = stubRoutes({
    "/api/v1/time-deals/items/1": () => Response.json(withTimeDeal(true)),
  });

  const product = await getDetailProduct("101", "1");

  expect(product?.price).toBe(24000);
  expect(product?.timeDeal?.purchasable).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("상품이 없으면 null이다", async () => {
  stubRoutes({ "/api/v1/products/999": notFound });

  expect(await getDetailProduct("999")).toBeNull();
});

// 없는 것과 서버 오류는 다르다. 오류를 정가 화면으로 덮으면 딜가를 잃은 줄 모른다
test("타임딜 상세가 404가 아닌 오류면 그대로 던진다", async () => {
  stubRoutes({
    "/api/v1/time-deals/items/1": () => Response.json({}, { status: 503 }),
    // 일반 상세는 성공한다. 오류를 덮으면 여기서 정가 화면이 나온다
    "/api/v1/products/101": () => Response.json(detail(101, 32000, null)),
  });

  await expect(getDetailProduct("101", "1")).rejects.toThrow();
});
