// 상품 조회 API. 검색 결과 목록·카테고리별 목록·상품 한 건의 요약(이름·대표 사진)을 부른다.
// 일반 async 함수라 서버 컴포넌트(await)·클라이언트(use()) 어디서나 쓸 수 있다.

import { apiRequest } from "@/shared/api/client";

export type ProductSort = "RECOMMEND" | "POPULAR" | "REVIEW" | "PRICE_DESC" | "PRICE_ASC";

/** 백엔드 `CategoryCode`. 화면의 URL 값(food·snack 등)과 이름이 달라 여기서 그대로
 *  받지 않는다 — 화면 쪽 모델이 매핑하고, 이 API는 백엔드 계약만 안다 */
export type ProductCategory = "FOOD" | "TREAT" | "SUPPLEMENT";

/** 백엔드 `ProductCardResponse` 그대로. 화면은 이 타입을 직접 쓰지 않는다 */
type ProductCardResponse = {
  productId: number;
  thumbnailUrl: string | null;
  productName: string;
  discountRate: number;
  price: number;
  /** 할인 전 가격. `Product.originalPrice` 열이 NULL을 허용한다 */
  originalPrice: number | null;
  unitPrice: number;
  unitLabel: string;
  avgRating: number;
  reviewCount: number;
};

/**
 * 백엔드 `ProductSearchResponse` 그대로.
 *
 * **`totalCount`는 커서 없이 부른 첫 쪽에서만 센다.** 다음 쪽(`cursor` 있음)은 null이다
 * (`ProductSearchService`, 배포 API로도 확인 #532).
 */
type ProductSearchApiResponse = {
  items: ProductCardResponse[];
  nextCursor: string | null;
  hasNext: boolean;
  totalCount: number | null;
};

/** 한 번에 받는 검색 결과 수. 서버 상한(30) 안이고, 다음 쪽도 같은 크기로 받는다 */
const SEARCH_PAGE_SIZE = 20;

/** 목록 카드 하나. 화면이 실제로 쓰는 필드만 이름을 옮겼다 */
export type ProductCard = {
  productId: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  originalPrice: number | null;
  /**
   * 서버가 `HALF_UP`으로 반올림해 준 값. 화면에서 두 금액으로 다시 계산하지 않는다 —
   * 공용 `calcDiscountRate`는 버림이라 상품 상세와 다른 %로 보인다.
   */
  discountRate: number;
  unitPrice: number;
  unitLabel: string;
  rating: number;
  reviewCount: number;
};

/**
 * 검색 결과 첫 쪽. 화면의 "총 N개"는 여기 `totalCount`다 — 다음 쪽을 이어 받아도 바꾸지 않는다.
 * 다음 쪽은 `nextCursor`로 `searchMoreProducts`를 불러 잇는다(#532).
 */
export type ProductSearchResult = {
  items: ProductCard[];
  totalCount: number;
  nextCursor: string | null;
  hasNext: boolean;
};

/** 검색 결과 다음 쪽. 서버가 다음 쪽에선 개수를 세지 않아 `totalCount`가 없다 */
export type ProductSearchNextPage = Omit<ProductSearchResult, "totalCount">;

function toProductCard(response: ProductCardResponse): ProductCard {
  return {
    productId: response.productId,
    name: response.productName,
    thumbnailUrl: response.thumbnailUrl,
    price: response.price,
    originalPrice: response.originalPrice,
    discountRate: response.discountRate,
    unitPrice: response.unitPrice,
    unitLabel: response.unitLabel,
    rating: response.avgRating,
    reviewCount: response.reviewCount,
  };
}

/**
 * 검색어로 상품을 찾는다(첫 쪽). 공개 엔드포인트라 토큰을 붙이지 않는다.
 *
 * **한 번에 전부 받지 않는다.** 서버가 `size`를 30으로 자른다(`product.list.max-size`).
 * 그 뒤는 `searchMoreProducts`로 이어 받는다 — 첫 20개에서 끊기면 "총 N개"만큼 볼 수 없다(#532).
 */
export function searchProducts(params: {
  keyword: string;
  sort: ProductSort;
}): Promise<ProductSearchResult> {
  // 커서 없이 부르면 서버가 반드시 센다. null은 다음 쪽에서만 온다
  return apiRequest<ProductSearchApiResponse & { totalCount: number }>("/products/search", {
    auth: false,
    query: { keyword: params.keyword, sort: params.sort, size: SEARCH_PAGE_SIZE },
  }).then((response) => ({
    items: response.items.map(toProductCard),
    totalCount: response.totalCount,
    nextCursor: response.nextCursor,
    hasNext: response.hasNext,
  }));
}

/**
 * 검색 결과 다음 쪽. 앞 쪽의 `nextCursor`를 그대로 넘긴다.
 *
 * **검색어·정렬은 첫 쪽과 같아야 한다.** 커서에 둘이 새겨져 있어 다르면 서버가 거절한다
 * (`PageCursor.validate`). 개수는 돌려주지 않는다 — 다음 쪽 응답엔 null이 온다.
 */
export function searchMoreProducts(params: {
  keyword: string;
  sort: ProductSort;
  cursor: string;
}): Promise<ProductSearchNextPage> {
  return apiRequest<ProductSearchApiResponse>("/products/search", {
    auth: false,
    query: {
      keyword: params.keyword,
      sort: params.sort,
      cursor: params.cursor,
      size: SEARCH_PAGE_SIZE,
    },
  }).then((response) => ({
    items: response.items.map(toProductCard),
    nextCursor: response.nextCursor,
    hasNext: response.hasNext,
  }));
}

/** 백엔드 `AllergenInfo` 그대로. `severity`는 `CRITICAL`·`SEVERE`·`MODERATE` 셋이다 */
type AllergenInfo = {
  code: string;
  displayName: string;
  severity: string;
};

/**
 * 백엔드 `ProductDetailResponse.TimeDealResponse` 그대로(sever#170). 시각은 오프셋이 붙은 ISO 문자열이다.
 *
 * `purchasable`은 서버가 **지금 이 딜로 살 수 있는지**를 끝까지 계산한 값이다 — 딜 기간 안이고
 * 딜이 `ACTIVE`이며 딜 재고가 남았을 때만 true다(`TimeDealDetailService`). 예정 딜·끝난 직후·재고
 * 소진이면 false다.
 */
type TimeDealResponse = {
  timeDealItemId: number;
  dealId: number;
  /** 보이는 딜만 200이라 `ACTIVE`·`SCHEDULED` 둘 중 하나다 */
  dealStatus: string;
  startAt: string;
  endAt: string;
  serverTime: string;
  purchasable: boolean;
};

/**
 * 백엔드 `ProductDetailResponse` 그대로.
 *
 * **null 여부는 OpenAPI가 아니라 엔티티에서 읽었다.** 명세에 `required`가 하나도 없어
 * 스키마로는 구분할 수 없고, `Product` 엔티티에서 `@Column(nullable = false)`가 붙지
 * 않은 열이 여기서 `| null`인 것들이다. 응답을 만드는 쪽(`ProductDetailResponse`)도
 * `targetBreedSize`·`targetAgeGroup`이 비면 null을 그대로 통과시킨다.
 */
type ProductDetailApiResponse = {
  productId: number;
  /**
   * 딜 아이템 번호의 옛 자리. **타임딜 상세(`getTimeDealDetail`)에서만 채워진다** — 일반 상품
   * 상세는 딜 중인 상품이어도 null이다. 백엔드 sever#170부터 `timeDeal.timeDealItemId`로
   * 옮겨 가 이 필드가 사라진다. 배포가 맞춰질 때까지 둘 다 읽는다 (#484)
   */
  timeDealItemId?: number | null;
  /** 타임딜 상세에서만 온다(sever#170). 일반 상품 상세는 null이다 */
  timeDeal?: TimeDealResponse | null;
  summary: {
    images: string[];
    productName: string;
    price: number;
    /** 할인 전 가격이 없는 상품이 있다 */
    originalPrice: number | null;
    /** 정가가 없으면 서버가 0을 준다. 계산은 서버가 끝내 준다 */
    discountRate: number;
    /** 아직 별점이 매겨지지 않았으면 비어 온다 */
    avgRating: number | null;
    reviewCount: number;
    soldOut: boolean;
  };
  detailInfo: {
    manufacturer: string | null;
    brandName: string | null;
    originCountry: string | null;
    netQuantityValue: number;
    netQuantityUnit: string;
    ingredients: string[];
    feedingTarget: string | null;
    /** "소형"처럼 표시명으로 온다 */
    targetBreedSize: string | null;
    /** "노령"처럼 표시명으로 온다 */
    targetAgeGroup: string | null;
    /** "강아지"·"고양이" 표시명 */
    targetSpecies: string[];
    feedingMethod: string | null;
    allergens: AllergenInfo[];
    /**
     * **코드가 아니라 표시명 배열이다.** 서버가 `CautionIngredientCode.getDisplayName()`을
     * 거쳐 내보낸다. 위험 등급(`CautionLevel`)은 이 응답에 없다 — 독성과 섭취 주의를
     * 가르려면 백엔드가 응답을 넓혀야 한다 (#414).
     */
    cautions: string[];
    consumptionPeriodDisplay: string | null;
    shelfLifeAfterOpeningDays: number | null;
    storageMethod: string | null;
  };
};

/** 상품 상세의 스펙 표가 쓰는 값. 표의 항목명은 화면이 붙인다 */
export type ProductDetailInfo = ProductDetailApiResponse["detailInfo"];

/**
 * 상품 상세 화면이 그대로 쓰는 모델.
 *
 * **`cautions`를 버리지 않고 담아 둔다.** 지금 화면에 그릴 자리가 없지만 경고·추천 제외로
 * 쓰기로 되어 있는 값이다 (#414). 여기서 떨어뜨리면 그 작업이 이 레이어부터 다시 열어야 한다.
 */
export type ProductDetail = {
  productId: number;
  /**
   * 타임딜 상세로 받았으면 그 딜 아이템 id. 장바구니에 담을 때 식별자가 달라진다 —
   * 일반 상품은 `NORMAL`+`productId`, 타임딜은 `TIME_DEAL`+`timeDealItemId`다.
   */
  timeDealItemId: number | null;
  /**
   * 타임딜 상세로 받았으면 그 딜의 종료 시각, 서버가 응답을 만든 시각, 지금 살 수 있는지. 일반 상품
   * 상세이거나 옛 응답(최상위 `timeDealItemId`만 오던 때)이면 null이다.
   *
   * **시각은 문자열로 둔다.** `time-deals.ts`와 같이 렌더링 경계(카운트다운)에서만 `Date`로 바꾼다.
   * 서버 시각은 기기 시계가 서버와 다를 때 남은 시간을 서버 기준으로 세려고 옮긴다(QA PD-063).
   */
  timeDeal: { endAt: string; serverTime: string; purchasable: boolean } | null;
  images: string[];
  name: string;
  price: number;
  originalPrice: number | null;
  /**
   * 서버가 계산해 준 값을 그대로 쓴다. 화면에서 두 금액으로 다시 계산하지 않는다 —
   * 서버는 반올림(HALF_UP)하고 화면의 `calcDiscountRate`는 버림이라 값이 갈린다.
   */
  discountRate: number;
  /** 아직 별점이 없으면 null. 0점과 다르다 */
  rating: number | null;
  reviewCount: number;
  soldOut: boolean;
  detail: ProductDetailInfo;
};

function toProductDetail(response: ProductDetailApiResponse): ProductDetail {
  return {
    productId: response.productId,
    timeDealItemId: response.timeDeal?.timeDealItemId ?? response.timeDealItemId ?? null,
    timeDeal: response.timeDeal
      ? {
          endAt: response.timeDeal.endAt,
          serverTime: response.timeDeal.serverTime,
          purchasable: response.timeDeal.purchasable,
        }
      : null,
    images: response.summary.images,
    name: response.summary.productName,
    price: response.summary.price,
    originalPrice: response.summary.originalPrice,
    discountRate: response.summary.discountRate,
    rating: response.summary.avgRating,
    reviewCount: response.summary.reviewCount,
    soldOut: response.summary.soldOut,
    detail: response.detailInfo,
  };
}

/**
 * 상품 한 건의 상세. 공개 엔드포인트라 토큰을 붙이지 않는다.
 *
 * 없는 상품이면 404가 오고 `apiRequest`가 `ApiError`를 던진다 — 라우트가 받아
 * `notFound()`로 넘긴다.
 */
export function getProductDetail(productId: string): Promise<ProductDetail> {
  // 경로 조각으로 인코딩한다. `productId`는 라우트 파라미터에서 검증 없이 오는 문자열이라
  // `/`나 `..`가 섞이면 URL 정규화가 일어나 상세가 아닌 다른 경로를 부르게 된다
  return apiRequest<ProductDetailApiResponse>(`/products/${encodeURIComponent(productId)}`, {
    auth: false,
  }).then(toProductDetail);
}

/**
 * 타임딜 아이템 한 건의 상세. 상품 상세와 같은 모양에 **딜가와 딜 아이템 번호가 붙는다.**
 * 공개 엔드포인트라 토큰을 붙이지 않는다.
 *
 * 딜 정보는 일반 상품 상세(`getProductDetail`)에 오지 않는다 — 딜 중인 상품이어도 정가와
 * 빈 딜 아이템 번호가 온다(로컬 백엔드 실측, #484). 끝났거나 보이지 않는 딜이면 404다.
 */
export function getTimeDealDetail(timeDealItemId: string): Promise<ProductDetail> {
  return apiRequest<ProductDetailApiResponse>(
    `/time-deals/items/${encodeURIComponent(timeDealItemId)}`,
    { auth: false },
  ).then(toProductDetail);
}

/** 리뷰 작성 화면의 상품 줄처럼 이름과 대표 사진만 필요한 자리가 쓴다 */
export type ProductSummary = {
  productId: number;
  name: string;
  /** 첫 번째 사진. 없으면 회색 자리만 남긴다 */
  imageUrl?: string;
};

/**
 * 상품 한 건의 요약. 상세를 받아 이름과 첫 사진만 남긴다.
 *
 * **상세와 같은 요청이다.** 따로 부르면 같은 엔드포인트를 두 벌로 다루게 되고,
 * `QUERY_KEYS.product.detail`을 이미 공유하고 있어 캐시도 한 자리다.
 *
 * 옵션명·재구매 횟수 같은 값은 응답에 없다. 화면이 그 자리를 비워 두는 이유다.
 */
export function getProductSummary(productId: string): Promise<ProductSummary> {
  return getProductDetail(productId).then((product) => ({
    productId: product.productId,
    name: product.name,
    ...(product.images[0] && { imageUrl: product.images[0] }),
  }));
}

/** 백엔드 `ProductListResponse` 그대로. 검색과 달리 `totalCount`가 없다 */
type ProductListApiResponse = {
  items: ProductCardResponse[];
  nextCursor: string | null;
  hasNext: boolean;
};

/** 카테고리 목록 화면이 쓰는 모델. 검색과 달리 총 개수가 없어 "총 N개"를 못 보여준다 */
export type ProductListResult = {
  items: ProductCard[];
  nextCursor: string | null;
  hasNext: boolean;
};

/**
 * 카테고리별 상품 목록을 커서로 이어 받는다. 공개 엔드포인트라 토큰을 붙이지 않는다.
 *
 * `category`는 백엔드 `CategoryCode`만 받는다 — "전체"에 대응하는 값이 없으므로
 * 그 경우엔 아예 undefined로 두고 호출한다(쿼리에서 빠진다).
 *
 * `size`를 빼면 서버 기본(10개)이다. 서버는 30개까지만 준다.
 */
// petId를 받지 않는다 — 백엔드가 받기만 하고 실제 조회에 반영하지 않는다(#289)
export function getProducts(params: {
  category?: ProductCategory;
  sort: ProductSort;
  cursor?: string;
  size?: number;
}): Promise<ProductListResult> {
  return apiRequest<ProductListApiResponse>("/products", {
    auth: false,
    query: {
      category: params.category,
      sort: params.sort,
      cursor: params.cursor,
      size: params.size,
    },
  }).then((response) => ({
    items: response.items.map(toProductCard),
    nextCursor: response.nextCursor,
    hasNext: response.hasNext,
  }));
}
