// 서버 컴포넌트가 직접 부르는 API를 흉내 내는 아주 작은 목 서버.
//
// 브라우저 레벨 page.route()는 Next 서버 프로세스가 보내는 요청을 못 가로챈다
// (별개의 Node 프로세스라서). 그래서 이 서버를 따로 띄우고 API_BASE_URL_INTERNAL이
// 이쪽을 가리키게 해서, 서버 fetch()가 실제로 이 서버에 닿게 만든다(#282).
//
// **검색 알고리즘을 복제하지 않는다.** 쿼리(keyword·sort)별로 미리 정해 둔 고정
// 응답만 돌려준다 — 진짜 필터·정렬 로직은 백엔드 몫이고, 여기선 화면과 흐름만 본다.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);

/** e2e 테스트가 이름·id로 확인하는 상품들. 옛 목데이터 이름·가격을 그대로 옮겼다 */
const PUPPY_FOOD = {
  productId: 4,
  productName: "퍼피 성장기 사료 1kg",
  price: 21000,
  discountRate: 0,
  unitPrice: 1060,
  unitLabel: "하루 예상 급여비 약",
  thumbnailUrl: null,
  avgRating: 4.6,
  reviewCount: 109,
};

const SENIOR_FOOD = {
  productId: 2,
  productName: "노령견 저지방 소화케어 사료 1kg",
  price: 27200,
  discountRate: 0,
  unitPrice: 1050,
  unitLabel: "하루 예상 급여비 약",
  thumbnailUrl: null,
  avgRating: 4.5,
  reviewCount: 108,
};

const ALLERGY_FOOD = {
  productId: 3,
  productName: "알레르기 케어 무곡물 사료 1kg",
  price: 26100,
  discountRate: 0,
  unitPrice: 1060,
  unitLabel: "하루 예상 급여비 약",
  thumbnailUrl: null,
  avgRating: 4.8,
  reviewCount: 508,
};

const SMALL_BREED_FOOD = {
  productId: 1,
  productName: "중소형견 소포장 사료 1kg",
  price: 31500,
  discountRate: 0,
  unitPrice: 1050,
  unitLabel: "하루 예상 급여비 약",
  thumbnailUrl: null,
  avgRating: 4.8,
  reviewCount: 108,
};

const FOOD_DEFAULT = [SMALL_BREED_FOOD, SENIOR_FOOD, ALLERGY_FOOD, PUPPY_FOOD];
const FOOD_PRICE_ASC = [PUPPY_FOOD, ALLERGY_FOOD, SENIOR_FOOD, SMALL_BREED_FOOD];
const FOOD_PRICE_DESC = [SMALL_BREED_FOOD, SENIOR_FOOD, ALLERGY_FOOD, PUPPY_FOOD];

/** keyword(+sort) 조합별 고정 응답. 없는 조합은 기본으로 빈 결과를 준다 */
function resolveItems(keyword, sort) {
  if (keyword === "사료") {
    if (sort === "PRICE_ASC") return FOOD_PRICE_ASC;
    if (sort === "PRICE_DESC") return FOOD_PRICE_DESC;
    return FOOD_DEFAULT;
  }
  if (keyword === "퍼피") return [PUPPY_FOOD];
  if (keyword === "무곡물") return [ALLERGY_FOOD];
  return [];
}

function searchProducts(url) {
  const keyword = url.searchParams.get("keyword") ?? "";
  const sort = url.searchParams.get("sort");
  const items = resolveItems(keyword, sort);
  return { items, nextCursor: null, hasNext: false, totalCount: items.length };
}

// 홈 카테고리 그리드(#289) 전용 목데이터. FOOD 카테고리만 두 페이지로 나눠 두어
// "더 보기" 커서 이어받기를 확인한다. 그 밖의 조합은 빈 목록을 준다
const FOOD_PAGE_1 = [
  {
    productId: 1,
    productName: "중소형견 소포장 사료 1kg",
    price: 31500,
    discountRate: 0,
    unitPrice: 1050,
    unitLabel: "1kg당",
    thumbnailUrl: null,
    avgRating: 4.8,
    reviewCount: 108,
  },
];
const FOOD_PAGE_2 = [
  {
    productId: 2,
    productName: "노령견 저지방 소화케어 사료 1kg",
    price: 27200,
    discountRate: 0,
    unitPrice: 1050,
    unitLabel: "1kg당",
    thumbnailUrl: null,
    avgRating: 4.5,
    reviewCount: 108,
  },
];

function getProducts(url) {
  const category = url.searchParams.get("category");
  const cursor = url.searchParams.get("cursor");
  if (category === "FOOD" && !cursor) {
    return { items: FOOD_PAGE_1, nextCursor: "page-2", hasNext: true };
  }
  if (category === "FOOD" && cursor === "page-2") {
    return { items: FOOD_PAGE_2, nextCursor: null, hasNext: false };
  }
  return { items: [], nextCursor: null, hasNext: false };
}

// 타임딜 목데이터. 옛 mock의 이름·가격을 그대로 옮겨 e2e/deals.server-fetch.spec.ts와 맞춘다
const NOW = () => new Date();
function hoursFromNow(hours) {
  return new Date(NOW().getTime() + hours * 3_600_000).toISOString();
}

function timeDeals(status) {
  if (status === "ACTIVE") {
    return {
      deals: [
        {
          dealId: 1,
          dealName: "타임딜",
          startAt: hoursFromNow(-1),
          endAt: hoursFromNow(11),
          items: [
            {
              productId: 101,
              timeDealItemId: 1,
              thumbnailUrl: null,
              productName: "오리&고구마 소형견 사료 1.5kg",
              normalPrice: 32000,
              discountedPrice: 24000,
              discountRate: 25,
              unitPrice: 960,
              unitLabel: "1kg당",
              stockBadge: "NONE",
            },
          ],
        },
      ],
      serverTime: NOW().toISOString(),
    };
  }
  if (status === "SCHEDULED") {
    return {
      deals: [
        {
          dealId: 2,
          dealName: "다음 타임딜",
          startAt: hoursFromNow(24),
          endAt: hoursFromNow(34),
          items: [
            {
              productId: 201,
              timeDealItemId: 2,
              thumbnailUrl: null,
              productName: "사슴고기&현미 소형견 사료 1.2kg",
              normalPrice: 20000,
              discountedPrice: 15600,
              discountRate: 22,
              unitPrice: 1300,
              unitLabel: "1kg당",
              stockBadge: "NONE",
            },
          ],
        },
      ],
      serverTime: NOW().toISOString(),
    };
  }
  return { deals: [], serverTime: NOW().toISOString() };
}

/**
 * 상품 상세(#413). 화면이 그리는 값이 **이 응답에서 왔다는 것을 보이려고** 목록 목데이터와
 * 다른 이름·가격을 쓴다 — 같은 값을 쓰면 옛 목데이터가 남아 있어도 테스트가 통과한다.
 *
 * 비어 올 수 있는 열도 일부러 섞는다. 제조국·보관방법을 null로 두어 표가 그 줄을 통째로
 * 빼는지 본다. 별점은 값이 있는 쪽으로 둔다 — 별점 없는 상품은 단위 테스트가 맡는다.
 */
const PRODUCT_DETAIL = {
  productId: 1,
  timeDealItemId: null,
  summary: {
    images: [],
    productName: "관절 튼튼 영양제 90정",
    price: 18000,
    originalPrice: 24000,
    discountRate: 25,
    avgRating: 4.7,
    reviewCount: 312,
    soldOut: false,
  },
  detailInfo: {
    manufacturer: "이엠펫푸드",
    brandName: "조인트케어",
    originCountry: null,
    netQuantityValue: 90,
    netQuantityUnit: "정",
    ingredients: ["글루코사민", "MSM"],
    feedingTarget: "8세 이상",
    targetBreedSize: "소형",
    targetAgeGroup: "노령",
    targetSpecies: ["강아지"],
    feedingMethod: "1일 1정, 사료와 함께 급여",
    allergens: [{ code: "EGG", displayName: "계란", severity: "CRITICAL" }],
    cautions: ["나트륨 과다"],
    consumptionPeriodDisplay: "제조일로부터 18개월",
    shelfLifeAfterOpeningDays: 60,
    storageMethod: null,
  },
};

/** 타임딜로 파는 상품. 담을 때 식별자가 딜 아이템으로 바뀌는지 본다 */
const TIME_DEAL_PRODUCT = {
  ...PRODUCT_DETAIL,
  productId: 101,
  timeDealItemId: 77,
  summary: { ...PRODUCT_DETAIL.summary, productName: "타임딜 관절 영양제 90정" },
};

/** 실제 백엔드가 주는 ProblemDetail 그대로. 라우트가 이 404를 받아 notFound()로 넘긴다 */
const PRODUCT_NOT_FOUND = {
  detail: "상품이 존재하지 않습니다.",
  status: 404,
  title: "PRODUCT_404_PRODUCT_NOT_FOUND",
  errorCode: "PRODUCT_404_PRODUCT_NOT_FOUND",
};

function productDetail(productId) {
  if (productId === "1") return PRODUCT_DETAIL;
  if (productId === "101") return TIME_DEAL_PRODUCT;
  return null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  // "더 보기"(#289)는 브라우저(Next 앱과 다른 포트)에서 직접 이 서버를 부른다 —
  // CORS 헤더가 없으면 응답이 와도 브라우저가 막는다
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (url.pathname === "/health") {
    res.writeHead(200).end("ok");
    return;
  }

  if (url.pathname === "/api/v1/products/search") {
    const body = JSON.stringify(searchProducts(url));
    res.writeHead(200, { "content-type": "application/json" }).end(body);
    return;
  }

  const detailMatch = /^\/api\/v1\/products\/([^/]+)$/.exec(url.pathname);
  if (detailMatch) {
    const product = productDetail(detailMatch[1]);
    if (!product) {
      res
        .writeHead(404, { "content-type": "application/json" })
        .end(JSON.stringify(PRODUCT_NOT_FOUND));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(product));
    return;
  }

  if (url.pathname === "/api/v1/products") {
    const body = JSON.stringify(getProducts(url));
    res.writeHead(200, { "content-type": "application/json" }).end(body);
    return;
  }

  if (url.pathname === "/api/v1/time-deals") {
    const status = url.searchParams.get("status");
    const body = JSON.stringify(timeDeals(status));
    res.writeHead(200, { "content-type": "application/json" }).end(body);
    return;
  }

  res
    .writeHead(404, { "content-type": "application/json" })
    .end(
      JSON.stringify({ title: "Not Found", status: 404, detail: `no mock for ${url.pathname}` }),
    );
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-api-server] listening on http://127.0.0.1:${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
