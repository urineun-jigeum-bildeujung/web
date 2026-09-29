// searchProducts·searchMoreProducts·getProducts·getProductDetail·getTimeDealDetail·getProductSummary 단위 테스트.
// 요청 파라미터 조립과 응답 필드 매핑을 본다.
import { afterEach, describe, expect, it, test, vi } from "vitest";

import {
  getProductDetail,
  getProducts,
  getProductSummary,
  getTimeDealDetail,
  searchMoreProducts,
  searchProducts,
} from "./products";

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("searchProducts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keyword·sort와 함께 임시 페이지 크기(20)를 쿼리로 보낸다", async () => {
    const fetchMock = stubFetch(
      Response.json({ items: [], nextCursor: null, hasNext: false, totalCount: 0 }),
    );

    await searchProducts({ keyword: "사료", sort: "PRICE_ASC" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/products/search?keyword=%EC%82%AC%EB%A3%8C&sort=PRICE_ASC&size=20");
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("응답 필드를 화면 모델로 옮기고 nextCursor·hasNext·totalCount를 보존한다", async () => {
    stubFetch(
      Response.json({
        items: [
          {
            productId: 1,
            thumbnailUrl: "https://example.com/a.jpg",
            productName: "오리&고구마 사료",
            discountRate: 25,
            price: 24000,
            originalPrice: 32000,
            unitPrice: 960,
            unitLabel: "g",
            avgRating: 4.8,
            reviewCount: 108,
          },
        ],
        nextCursor: "abc",
        hasNext: true,
        totalCount: 42,
      }),
    );

    const result = await searchProducts({ keyword: "사료", sort: "RECOMMEND" });

    expect(result).toEqual({
      items: [
        {
          productId: 1,
          name: "오리&고구마 사료",
          thumbnailUrl: "https://example.com/a.jpg",
          price: 24000,
          originalPrice: 32000,
          discountRate: 25,
          unitPrice: 960,
          unitLabel: "g",
          rating: 4.8,
          reviewCount: 108,
        },
      ],
      totalCount: 42,
      nextCursor: "abc",
      hasNext: true,
    });
  });
});

// 첫 20개에서 끊겨 "총 N개"만큼 볼 수 없었다(QA SR-014, #532)
describe("searchMoreProducts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("첫 쪽의 검색어·정렬에 커서를 실어 같은 크기로 다음 쪽을 부른다", async () => {
    const fetchMock = stubFetch(
      Response.json({ items: [], nextCursor: null, hasNext: false, totalCount: null }),
    );

    await searchMoreProducts({ keyword: "사료", sort: "PRICE_ASC", cursor: "abc" });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "/api/v1/products/search?keyword=%EC%82%AC%EB%A3%8C&sort=PRICE_ASC&cursor=abc&size=20",
    );
  });

  // 서버는 다음 쪽에서 개수를 세지 않고 null을 준다. 그 값을 옮기면 "총 null개"가 된다
  it("다음 쪽은 개수 없이 목록과 커서만 돌려준다", async () => {
    stubFetch(
      Response.json({
        items: [
          {
            productId: 2,
            thumbnailUrl: null,
            productName: "노령견 저지방 소화케어 사료 1kg",
            discountRate: 0,
            price: 27200,
            originalPrice: null,
            unitPrice: 27,
            unitLabel: "g",
            avgRating: 4.5,
            reviewCount: 108,
          },
        ],
        nextCursor: "def",
        hasNext: true,
        totalCount: null,
      }),
    );

    const page = await searchMoreProducts({ keyword: "사료", sort: "RECOMMEND", cursor: "abc" });

    expect(page).toEqual({
      items: [
        {
          productId: 2,
          name: "노령견 저지방 소화케어 사료 1kg",
          thumbnailUrl: null,
          price: 27200,
          originalPrice: null,
          discountRate: 0,
          unitPrice: 27,
          unitLabel: "g",
          rating: 4.5,
          reviewCount: 108,
        },
      ],
      nextCursor: "def",
      hasNext: true,
    });
  });
});

test("상품 요약은 이름과 첫 사진만 옮기고 사진이 없으면 키를 두지 않는다", async () => {
  const detail = {
    productId: 7,
    timeDealItemId: null,
    summary: { images: [], productName: "오메가3 피쉬오일 60캡슐" },
    detailInfo: {},
  };
  const fetchMock = vi.fn().mockResolvedValue(Response.json(detail));
  vi.stubGlobal("fetch", fetchMock);

  const summary = await getProductSummary("7");

  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/products/7");
  expect(summary).toEqual({ productId: 7, name: "오메가3 피쉬오일 60캡슐" });
  expect("imageUrl" in summary).toBe(false);
  vi.unstubAllGlobals();
});

// 일반 상품 상세는 딜 중인 상품이어도 딜 번호를 채우지 않는다(로컬 백엔드 실측, #484)
const response = {
  productId: 7,
  timeDealItemId: null,
  summary: {
    images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
    productName: "오메가3 피쉬오일 60캡슐",
    price: 21000,
    originalPrice: 30000,
    discountRate: 30,
    avgRating: 4.8,
    reviewCount: 108,
    soldOut: false,
  },
  detailInfo: {
    manufacturer: "대한펫푸드",
    brandName: "포포도그",
    originCountry: "대한민국",
    netQuantityValue: 90,
    netQuantityUnit: "정",
    ingredients: ["타우린", "글루코사민"],
    feedingTarget: "노령견",
    targetBreedSize: "소형·중형",
    targetAgeGroup: "노령",
    targetSpecies: ["강아지"],
    feedingMethod: "1일 1정, 사료와 함께 급여",
    allergens: [{ code: "EGG", displayName: "계란", severity: "CRITICAL" }],
    // 서버가 CautionIngredientCode.getDisplayName()을 거쳐 내보낸다. 코드가 아니다
    cautions: ["나트륨 과다"],
    consumptionPeriodDisplay: "제조일로부터 18개월",
    shelfLifeAfterOpeningDays: 60,
    storageMethod: "직사광선을 피해 서늘하고 건조한 곳에 보관",
  },
};

describe("getProductDetail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("토큰 없이 상품 한 건을 부른다", async () => {
    const fetchMock = stubFetch(Response.json(response));

    await getProductDetail("7");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/products/7");
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  // 인코딩하지 않으면 `..`가 정규화되어 /api/v1/products/reviews를 부른다
  it("경로 구분자가 섞인 productId도 한 조각으로 보낸다", async () => {
    const fetchMock = stubFetch(Response.json(response));

    await getProductDetail("1/../reviews");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("/api/v1/products/1%2F..%2Freviews");
  });

  it("응답을 화면 모델로 옮긴다. 할인율은 서버 값을 그대로 쓴다", async () => {
    stubFetch(Response.json(response));

    const product = await getProductDetail("7");

    expect(product).toEqual({
      productId: 7,
      timeDealItemId: null,
      timeDeal: null,
      images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
      name: "오메가3 피쉬오일 60캡슐",
      price: 21000,
      originalPrice: 30000,
      discountRate: 30,
      rating: 4.8,
      reviewCount: 108,
      soldOut: false,
      detail: response.detailInfo,
    });
  });

  // 백엔드 sever#170부터는 최상위 딜 번호 필드가 아예 없다
  it("딜 번호 필드가 없어도 null로 둔다", async () => {
    // JSON으로 보낼 때 undefined 필드는 빠진다
    stubFetch(Response.json({ ...response, timeDealItemId: undefined }));

    const product = await getProductDetail("7");

    expect(product.timeDealItemId).toBeNull();
  });

  // 지금 화면엔 그릴 자리가 없지만 경고로 쓸 값이다 (#414).
  // 위험 등급(CautionLevel)은 이 응답에 없어 독성과 섭취 주의를 가를 수 없다
  it("cautions를 표시명 그대로 담아 둔다", async () => {
    stubFetch(Response.json(response));

    const product = await getProductDetail("7");

    expect(product.detail.cautions).toEqual(["나트륨 과다"]);
  });

  it("정가·별점이 비어 오는 상품을 견딘다", async () => {
    stubFetch(
      Response.json({
        ...response,
        summary: { ...response.summary, originalPrice: null, avgRating: null, discountRate: 0 },
      }),
    );

    const product = await getProductDetail("7");

    expect(product.originalPrice).toBeNull();
    expect(product.rating).toBeNull();
  });
});

describe("getTimeDealDetail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 딜가와 딜 번호는 일반 상품 상세에 오지 않는다. 타임딜 상세에서만 온다 (#484)
  it("토큰 없이 딜 아이템 한 건을 부른다", async () => {
    const fetchMock = stubFetch(Response.json({ ...response, timeDealItemId: 1 }));

    await getTimeDealDetail("1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/time-deals/items/1");
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("새 응답(sever#170)의 timeDeal에서 딜 번호를 읽는다", async () => {
    stubFetch(
      Response.json({
        ...response,
        timeDealItemId: undefined,
        timeDeal: {
          timeDealItemId: 1,
          dealId: 3,
          dealStatus: "ACTIVE",
          startAt: "2026-09-29T10:00:00+09:00",
          endAt: "2026-09-29T22:00:00+09:00",
          serverTime: "2026-09-29T12:00:00+09:00",
          purchasable: true,
        },
      }),
    );

    const product = await getTimeDealDetail("1");

    expect(product.timeDealItemId).toBe(1);
    // 배지·카운트다운을 실데이터로 그리는 값이다. 버리면 타임딜 화면이 개발용 `?status=deal`로만 뜬다(QA PD-063)
    expect(product.timeDeal).toEqual({ endAt: "2026-09-29T22:00:00+09:00", purchasable: true });
  });

  it("옛 응답의 최상위 딜 번호도 읽는다", async () => {
    stubFetch(Response.json({ ...response, timeDealItemId: 1 }));

    const product = await getTimeDealDetail("1");

    expect(product.timeDealItemId).toBe(1);
    // 옛 응답에는 기간이 없다. 타임딜 화면을 지어내지 않는다
    expect(product.timeDeal).toBeNull();
  });
});

describe("getProducts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("category·sort·cursor를 쿼리로 보낸다", async () => {
    const fetchMock = stubFetch(Response.json({ items: [], nextCursor: null, hasNext: false }));

    await getProducts({ category: "TREAT", sort: "POPULAR", cursor: "xyz" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/products?category=TREAT&sort=POPULAR&cursor=xyz");
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it('category가 없으면 쿼리에서도 빠진다("전체"는 백엔드 값이 없다)', async () => {
    const fetchMock = stubFetch(Response.json({ items: [], nextCursor: null, hasNext: false }));

    await getProducts({ sort: "RECOMMEND" });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/products?sort=RECOMMEND");
  });

  it("size를 주면 쿼리로 보낸다", async () => {
    const fetchMock = stubFetch(Response.json({ items: [], nextCursor: null, hasNext: false }));

    await getProducts({ sort: "POPULAR", size: 7 });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/products?sort=POPULAR&size=7");
  });

  it("응답 필드를 화면 모델로 옮기고 nextCursor·hasNext를 보존한다. totalCount는 없다", async () => {
    stubFetch(
      Response.json({
        items: [
          {
            productId: 1,
            thumbnailUrl: null,
            productName: "퍼피 성장기 사료 1kg",
            discountRate: 0,
            price: 21000,
            originalPrice: null,
            unitPrice: 1060,
            unitLabel: "g",
            avgRating: 4.6,
            reviewCount: 109,
          },
        ],
        nextCursor: "next-1",
        hasNext: true,
      }),
    );

    const result = await getProducts({ category: "FOOD", sort: "POPULAR" });

    expect(result).toEqual({
      items: [
        {
          productId: 1,
          name: "퍼피 성장기 사료 1kg",
          thumbnailUrl: null,
          price: 21000,
          originalPrice: null,
          discountRate: 0,
          unitPrice: 1060,
          unitLabel: "g",
          rating: 4.6,
          reviewCount: 109,
        },
      ],
      nextCursor: "next-1",
      hasNext: true,
    });
    expect(result).not.toHaveProperty("totalCount");
  });
});
