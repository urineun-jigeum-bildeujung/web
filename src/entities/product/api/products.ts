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
  unitPrice: number;
  unitLabel: string;
  avgRating: number;
  reviewCount: number;
};

/** 백엔드 `ProductSearchResponse` 그대로 */
type ProductSearchApiResponse = {
  items: ProductCardResponse[];
  nextCursor: string | null;
  hasNext: boolean;
  totalCount: number;
};

/** 목록 카드 하나. 화면이 실제로 쓰는 필드만 이름을 옮겼다 */
export type ProductCard = {
  productId: number;
  name: string;
  thumbnailUrl: string | null;
  price: number;
  discountRate: number;
  unitPrice: number;
  unitLabel: string;
  rating: number;
  reviewCount: number;
};

/**
 * 검색 결과 화면이 그대로 쓰는 모델.
 *
 * **`nextCursor`·`hasNext`를 지금 화면이 안 쓰더라도 갖고 있는다.** 지금은 첫 페이지
 * (`items`)만 보여주고 더보기를 만들지 않았는데, 나중에 커서 추가 로딩을 붙일 때 이
 * API 레이어를 다시 뜯지 않으려면 처음부터 다 보존해 둬야 한다.
 */
export type ProductSearchResult = {
  items: ProductCard[];
  totalCount: number;
  nextCursor: string | null;
  hasNext: boolean;
};

function toProductCard(response: ProductCardResponse): ProductCard {
  return {
    productId: response.productId,
    name: response.productName,
    thumbnailUrl: response.thumbnailUrl,
    price: response.price,
    discountRate: response.discountRate,
    unitPrice: response.unitPrice,
    unitLabel: response.unitLabel,
    rating: response.avgRating,
    reviewCount: response.reviewCount,
  };
}

/**
 * 검색어로 상품을 찾는다. 공개 엔드포인트라 토큰을 붙이지 않는다.
 *
 * **`size`는 임시로 20을 못박아 둔다.** 서버가 큰 값을 거부하지 않는 걸 확인했지만
 * (예: 1000도 200을 준다), 내부에 숨은 상한이 있는지는 실제 데이터로 검증하지
 * 못했다. 그래서 "이 요청 하나로 전체를 받는다"고 가정하지 않는다 — 결과가 이
 * 크기를 넘으면 나머지는 지금 화면에서 접근할 방법이 없다(#282, 더보기/커서
 * 추가 로딩 붙이기 전까지 이슈를 닫지 않는다).
 */
export function searchProducts(params: {
  keyword: string;
  sort: ProductSort;
}): Promise<ProductSearchResult> {
  return apiRequest<ProductSearchApiResponse>("/products/search", {
    auth: false,
    query: { keyword: params.keyword, sort: params.sort, size: 20 },
  }).then((response) => ({
    items: response.items.map(toProductCard),
    totalCount: response.totalCount,
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

/** 백엔드 `ProductDetailResponse` 그대로 */
type ProductDetailApiResponse = {
  productId: number;
  /** 타임딜 진행 중일 때만 온다 */
  timeDealItemId: number | null;
  summary: {
    images: string[];
    productName: string;
    price: number;
    originalPrice: number;
    discountRate: number;
    avgRating: number;
    reviewCount: number;
    soldOut: boolean;
  };
  detailInfo: {
    manufacturer: string;
    brandName: string;
    originCountry: string;
    netQuantityValue: number;
    netQuantityUnit: string;
    ingredients: string[];
    feedingTarget: string;
    targetBreedSize: string;
    targetAgeGroup: string;
    targetSpecies: string[];
    feedingMethod: string;
    allergens: AllergenInfo[];
    cautions: string[];
    consumptionPeriodDisplay: string;
    shelfLifeAfterOpeningDays: number;
    storageMethod: string;
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
   * 타임딜 진행 중이면 그 딜 아이템 id. 장바구니에 담을 때 식별자가 달라진다 —
   * 일반 상품은 `NORMAL`+`productId`, 타임딜은 `TIME_DEAL`+`timeDealItemId`다.
   */
  timeDealItemId: number | null;
  images: string[];
  name: string;
  price: number;
  originalPrice: number;
  /** 서버가 계산해 준 값을 그대로 쓴다. 화면에서 두 금액으로 다시 계산하지 않는다 */
  discountRate: number;
  rating: number;
  reviewCount: number;
  soldOut: boolean;
  detail: ProductDetailInfo;
};

function toProductDetail(response: ProductDetailApiResponse): ProductDetail {
  return {
    productId: response.productId,
    timeDealItemId: response.timeDealItemId,
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
  return apiRequest<ProductDetailApiResponse>(`/products/${productId}`, { auth: false }).then(
    toProductDetail,
  );
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
 */
// petId를 받지 않는다 — 백엔드가 받기만 하고 실제 조회에 반영하지 않는다(#289)
export function getProducts(params: {
  category?: ProductCategory;
  sort: ProductSort;
  cursor?: string;
}): Promise<ProductListResult> {
  return apiRequest<ProductListApiResponse>("/products", {
    auth: false,
    query: { category: params.category, sort: params.sort, cursor: params.cursor },
  }).then((response) => ({
    items: response.items.map(toProductCard),
    nextCursor: response.nextCursor,
    hasNext: response.hasNext,
  }));
}
