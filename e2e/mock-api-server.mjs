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
  unitPrice: 21,
  unitLabel: "g",
  thumbnailUrl: null,
  avgRating: 4.6,
  reviewCount: 109,
};

const SENIOR_FOOD = {
  productId: 2,
  productName: "노령견 저지방 소화케어 사료 1kg",
  price: 27200,
  discountRate: 0,
  unitPrice: 27,
  unitLabel: "g",
  thumbnailUrl: null,
  avgRating: 4.5,
  reviewCount: 108,
};

const ALLERGY_FOOD = {
  productId: 3,
  productName: "알레르기 케어 무곡물 사료 1kg",
  price: 26100,
  discountRate: 0,
  unitPrice: 26,
  unitLabel: "g",
  thumbnailUrl: null,
  avgRating: 4.8,
  reviewCount: 508,
};

const SMALL_BREED_FOOD = {
  productId: 1,
  productName: "중소형견 소포장 사료 1kg",
  price: 31500,
  discountRate: 0,
  unitPrice: 32,
  unitLabel: "g",
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

// `1kg`만 두 쪽으로 나눠 목록 끝에서 다음 쪽을 이어 받는지 본다(#532). 서버처럼 개수는
// 커서 없는 첫 쪽에서만 세고, 다음 쪽(cursor 있음)은 null을 준다(`ProductSearchService`)
const ONE_KG_PAGE_1 = [SMALL_BREED_FOOD, SENIOR_FOOD];
const ONE_KG_PAGE_2 = [ALLERGY_FOOD, PUPPY_FOOD];

function searchProducts(url) {
  const keyword = url.searchParams.get("keyword") ?? "";
  const sort = url.searchParams.get("sort");
  const cursor = url.searchParams.get("cursor");
  if (keyword === "1kg") {
    return cursor === "1kg-page-2"
      ? { items: ONE_KG_PAGE_2, nextCursor: null, hasNext: false, totalCount: null }
      : { items: ONE_KG_PAGE_1, nextCursor: "1kg-page-2", hasNext: true, totalCount: 4 };
  }
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
    unitPrice: 32,
    unitLabel: "g",
    thumbnailUrl: null,
    avgRating: 4.8,
    reviewCount: 108,
  },
  // 이름이 칸보다 긴 상품. 카드가 이름 길이만큼 넓어져 옆 칸을 덮던 것을 본다(#534)
  {
    productId: 5,
    productName: "담았냥 그레인프리 가다랑어 시니어 전연령 고양이 사료 1kg",
    price: 24700,
    discountRate: 0,
    unitPrice: 25,
    unitLabel: "g",
    thumbnailUrl: null,
    avgRating: 0,
    reviewCount: 0,
  },
];
const FOOD_PAGE_2 = [
  {
    productId: 2,
    productName: "노령견 저지방 소화케어 사료 1kg",
    price: 27200,
    discountRate: 0,
    unitPrice: 27,
    unitLabel: "g",
    thumbnailUrl: null,
    avgRating: 4.5,
    reviewCount: 108,
  },
];

// 상품 상세의 "함께 보면 좋은 상품"(#481)은 카테고리 없이 인기순으로 부른다. 지금 보는 상품(1)이
// 섞여 와야 화면이 빼는지 볼 수 있어 일부러 넣는다. 서버처럼 size만큼 자른다
const POPULAR = [SMALL_BREED_FOOD, SENIOR_FOOD, ALLERGY_FOOD, PUPPY_FOOD];

function getProducts(url) {
  const category = url.searchParams.get("category");
  const cursor = url.searchParams.get("cursor");
  if (!category && url.searchParams.get("sort") === "POPULAR") {
    const size = Number(url.searchParams.get("size") ?? 10);
    return { items: POPULAR.slice(0, size), nextCursor: null, hasNext: false };
  }
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
              unitPrice: 16,
              unitLabel: "g",
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
              unitPrice: 13,
              unitLabel: "g",
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
 * 상품 사진 두 장. **앱과 같은 출처의 경로**를 준다 (`public/images/e2e/`의 16×16 PNG 둘).
 *
 * **사진 목록을 비워 두면 캐러셀과 `next/image` 경로를 한 번도 지나지 않는다.** 그래서
 * 실제 바이트가 있는 자산을 가리킨다.
 *
 * **왜 목 서버가 직접 이미지를 주지 않는가** — Next 16의 최적화 서버는 업스트림 이미지가
 * 사설 IP로 풀리면 거부한다(`hostname resolved to private IP`, SSRF 방어). `remotePatterns`에
 * `localhost`가 있어도 막히고, 풀려면 `images.dangerouslyAllowLocalIP`를 켜야 한다 — 운영
 * 설정에 보안 플래그를 넣지 않기로 했다. 같은 출처 경로는 그 검사를 지나지 않는다.
 *
 * 그래서 이 테스트가 보는 것은 **캐러셀과 렌더 경로**다. 운영 원격 호스트 허용 여부는
 * 백엔드가 호스트를 확정한 뒤 따로 검증한다.
 */
const IMAGE_PATHS = ["/images/e2e/product-photo-1.png", "/images/e2e/product-photo-2.png"];

/**
 * 상품 상세(#413). 화면이 그리는 값이 **이 응답에서 왔다는 것을 보이려고** 목록 목데이터와
 * 다른 이름·가격을 쓴다 — 같은 값을 쓰면 옛 목데이터가 남아 있어도 테스트가 통과한다.
 *
 * 비어 올 수 있는 열도 일부러 섞는다. 제조국·보관방법을 null로 두어 표가 그 줄을 통째로
 * 빼는지 본다. 별점은 값이 있는 쪽으로 둔다 — 별점 없는 상품은 단위 테스트가 맡는다.
 *
 * 실제 서버(sever#170)처럼 일반 상품 상세는 `timeDeal: null`이고 최상위 딜 번호가 없다(#539).
 */
const PRODUCT_DETAIL = {
  productId: 1,
  timeDeal: null,
  summary: {
    images: IMAGE_PATHS,
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
    cautions: ["고염분"],
    consumptionPeriodDisplay: "제조일로부터 18개월",
    shelfLifeAfterOpeningDays: 60,
    storageMethod: null,
  },
};

/**
 * 진행 중 딜(`timeDeals("ACTIVE")`)의 상품 101을 **일반 상품 상세로** 부른 것. 실제 서버처럼
 * 딜 중이어도 정가와 `timeDeal: null`을 준다 — 전에는 여기에 딜 번호를 넣어 두어, 상세가 딜가를
 * 한 번도 받지 못하는데도 E2E가 통과했다 (#484)
 */
const TIME_DEAL_PRODUCT = {
  ...PRODUCT_DETAIL,
  productId: 101,
  summary: {
    ...PRODUCT_DETAIL.summary,
    productName: "오리&고구마 소형견 사료 1.5kg",
    price: 32000,
    originalPrice: null,
    discountRate: 0,
  },
};

/**
 * 같은 상품을 **타임딜 상세**(`/time-deals/items/{id}`)로 부른 것. 딜가와 딜 정보가 붙는다.
 * 백엔드 sever#170의 새 모양(`timeDeal` 객체, 최상위 `timeDealItemId` 없음)으로 둔다 —
 * 옛 모양은 단위 테스트가 본다
 */
function timeDealDetail(timeDealItemId) {
  if (timeDealItemId !== "1") return null;
  return {
    ...TIME_DEAL_PRODUCT,
    timeDeal: {
      timeDealItemId: 1,
      dealId: 1,
      dealStatus: "ACTIVE",
      startAt: hoursFromNow(-1),
      endAt: hoursFromNow(11),
      serverTime: NOW().toISOString(),
      purchasable: true,
    },
    summary: { ...TIME_DEAL_PRODUCT.summary, price: 24000, originalPrice: 32000, discountRate: 25 },
  };
}

/** 끝났거나 없는 딜. 실제 백엔드의 ProblemDetail 모양 */
const TIME_DEAL_ITEM_NOT_FOUND = {
  detail: "타임딜 상품이 존재하지 않습니다.",
  status: 404,
  title: "PRODUCT_404_TIME_DEAL_ITEM_NOT_FOUND",
  errorCode: "PRODUCT_404_TIME_DEAL_ITEM_NOT_FOUND",
};

/** 실제 백엔드가 주는 ProblemDetail 그대로. 라우트가 이 404를 받아 notFound()로 넘긴다 */
const PRODUCT_NOT_FOUND = {
  detail: "상품이 존재하지 않습니다.",
  status: 404,
  title: "PRODUCT_404_PRODUCT_NOT_FOUND",
  errorCode: "PRODUCT_404_PRODUCT_NOT_FOUND",
};

/**
 * 리뷰(#339). 상품 상세의 리뷰 탭과 사진 모음 화면이 브라우저에서 직접 부른다.
 *
 * **실제 백엔드 응답 모양 그대로다.** 목록에는 `hasNext`가 없고 `totalCount`만 오며,
 * 사진 없는 후기의 `images`는 빈 배열이 아니라 `null`, 닉네임을 못 찾은 회원은 빈 문자열,
 * 고양이는 `breedSize`가 `null`이다. `usagePeriod`는 목록도 상세도 일 단위 숫자이고,
 * 공개 상세에도 `nickname`·`likeCount`·`liked`가 실린다.
 *
 * 사진 주소는 로컬 파일이라 next/image의 remotePatterns를 타지 않는다.
 */
const REVIEW_PHOTO_URLS = ["/images/e2e/product-photo-1.png", "/images/e2e/product-photo-2.png"];

/** 7번 후기가 사진 두 장(아이 두 마리), 9번이 한 장, 11번은 사진 없음 */
const REVIEWS = [
  {
    reviewId: 7,
    nickname: "댕댕이맘",
    pets: [
      {
        petId: 101,
        name: "보리",
        sex: "FEMALE",
        age: 8,
        breedSize: "SMALL",
        species: "DOG",
        breedId: 12,
        weight: 4,
      },
      {
        petId: 102,
        name: "나비",
        sex: "MALE",
        age: 3,
        breedSize: null,
        species: "CAT",
        breedId: 45,
        weight: 4.2,
      },
    ],
    rating: 4.5,
    usagePeriod: 21,
    palatability: null,
    text: "확실히 예전보다 계단 오를 때 덜 힘들어해요.",
    images: REVIEW_PHOTO_URLS,
    liked: false,
    likeCount: 32,
    createdAt: "2026-09-27",
  },
  {
    reviewId: 9,
    nickname: "초코집사",
    pets: [
      {
        petId: 105,
        name: "초코",
        sex: "MALE",
        age: 6,
        breedSize: "LARGE",
        species: "DOG",
        breedId: 30,
        weight: 28,
      },
    ],
    rating: 5,
    usagePeriod: 180,
    palatability: null,
    text: "대형견이라 양이 많이 드는데 좋아요.",
    images: [REVIEW_PHOTO_URLS[1]],
    liked: true,
    likeCount: 51,
    createdAt: "2026-09-20",
  },
  {
    reviewId: 11,
    nickname: "",
    pets: [
      {
        petId: 113,
        name: "해피",
        sex: "MALE",
        age: 4,
        breedSize: "MEDIUM",
        species: "DOG",
        breedId: 7,
        weight: 12.5,
      },
    ],
    rating: 3.5,
    usagePeriod: 14,
    palatability: null,
    text: "닉네임을 못 찾는 회원의 후기입니다.",
    images: null,
    liked: false,
    likeCount: 0,
    createdAt: "2026-09-10",
  },
];

/** 사진 낱장. 백엔드 쿼리와 같게 후기 최신순 → 그 안에서 sortOrder 오름차순이다 */
const REVIEW_PHOTOS = [
  { reviewId: 7, imageUrl: REVIEW_PHOTO_URLS[0] },
  { reviewId: 7, imageUrl: REVIEW_PHOTO_URLS[1] },
  { reviewId: 9, imageUrl: REVIEW_PHOTO_URLS[1] },
];

/** 대표 사진은 후기당 첫 장(sortOrder 0)이다 */
const FEATURED_PHOTOS = [
  { reviewId: 7, imageUrl: REVIEW_PHOTO_URLS[0] },
  { reviewId: 9, imageUrl: REVIEW_PHOTO_URLS[1] },
];

const REVIEW_NOT_FOUND = {
  detail: "리뷰를 찾을 수 없습니다.",
  status: 404,
  title: "REVIEW_404_NOT_FOUND",
  errorCode: "REVIEW_404_NOT_FOUND",
};

/** 상품 1번만 후기가 있다. 999번으로 빈 상태를 본다 */
function productReviews(productId, url) {
  if (productId !== "1") return { averageRating: 0.0, totalCount: 0, content: [] };

  const sort = url.searchParams.get("sort");
  const ordered =
    sort === "RATING_LOW" ? [...REVIEWS].sort((a, b) => a.rating - b.rating) : REVIEWS;
  const page = Number(url.searchParams.get("page") ?? 0);
  const size = Number(url.searchParams.get("size") ?? 10);

  return {
    averageRating: 4.3,
    totalCount: ordered.length,
    content: ordered.slice(page * size, (page + 1) * size),
  };
}

/** 공개 리뷰 상세. 사진 뷰어의 카드가 이걸로 채워진다 */
function reviewDetail(reviewId) {
  const review = REVIEWS.find((item) => String(item.reviewId) === reviewId);
  if (!review) return null;
  return {
    reviewId: review.reviewId,
    isMine: false,
    nickname: review.nickname,
    product: { productId: 1, name: "관절 튼튼 영양제 90정", image: null },
    pets: review.pets,
    rating: review.rating,
    usagePeriod: review.usagePeriod,
    answerValues: [],
    goodPoints: null,
    badPoints: null,
    matchScore: null,
    text: review.text,
    images: review.images,
    likeCount: review.likeCount,
    liked: review.liked,
    createdAt: review.createdAt,
  };
}

/**
 * 비교 화면이 검색에서 고른 4번을 상세로 받는다(#535). 검색 카드(`PUPPY_FOOD`)와 이름·가격을 맞춘다 —
 * 비교 자리는 이 응답의 이름을 그린다
 */
const PUPPY_FOOD_DETAIL = {
  ...PRODUCT_DETAIL,
  productId: 4,
  summary: {
    ...PRODUCT_DETAIL.summary,
    productName: PUPPY_FOOD.productName,
    price: PUPPY_FOOD.price,
    originalPrice: PUPPY_FOOD.price,
    discountRate: 0,
  },
};

function productDetail(productId) {
  if (productId === "1") return PRODUCT_DETAIL;
  if (productId === "4") return PUPPY_FOOD_DETAIL;
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

  const dealDetailMatch = /^\/api\/v1\/time-deals\/items\/([^/]+)$/.exec(url.pathname);
  if (dealDetailMatch) {
    const product = timeDealDetail(dealDetailMatch[1]);
    if (!product) {
      res
        .writeHead(404, { "content-type": "application/json" })
        .end(JSON.stringify(TIME_DEAL_ITEM_NOT_FOUND));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(product));
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

  const reviewListMatch = /^\/api\/v1\/reviews\/products\/([^/]+)$/.exec(url.pathname);
  if (reviewListMatch) {
    const body = JSON.stringify(productReviews(reviewListMatch[1], url));
    res.writeHead(200, { "content-type": "application/json" }).end(body);
    return;
  }

  const photosMatch = /^\/api\/v1\/reviews\/products\/([^/]+)\/photos$/.exec(url.pathname);
  if (photosMatch) {
    const photos = photosMatch[1] === "1" ? REVIEW_PHOTOS : [];
    const body = JSON.stringify({ totalCount: photos.length, photos, hasNext: false });
    res.writeHead(200, { "content-type": "application/json" }).end(body);
    return;
  }

  const featuredMatch = /^\/api\/v1\/reviews\/products\/([^/]+)\/photos\/featured$/.exec(
    url.pathname,
  );
  if (featuredMatch) {
    const photos = featuredMatch[1] === "1" ? FEATURED_PHOTOS : [];
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ photos }));
    return;
  }

  const reviewDetailMatch = /^\/api\/v1\/reviews\/([0-9]+)$/.exec(url.pathname);
  if (reviewDetailMatch) {
    const review = reviewDetail(reviewDetailMatch[1]);
    if (!review) {
      res
        .writeHead(404, { "content-type": "application/json" })
        .end(JSON.stringify(REVIEW_NOT_FOUND));
      return;
    }
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(review));
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
