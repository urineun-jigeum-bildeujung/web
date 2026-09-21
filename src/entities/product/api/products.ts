// 상품 조회 API. 검색 결과 목록을 부른다.
//
// **일반 async 함수다.** React를 몰라도 되고, 반환하는 Promise를 그대로 화면에 넘기면
// 서버 컴포넌트(await)에서도, `use()`로 클라이언트에 흘려보내는 곳에서도 똑같이 쓸 수 있다.
//
// 규격 출처는 실행 중인 백엔드(product-service)의 실제 OpenAPI(`/v3/api-docs`)와
// 컨트롤러 소스로 직접 확인했다(2026-09-21, #282). 정가(originalPrice)는 응답에 없고
// `discountRate`만 있는데, 반올림된 값에서 역산하면 실제 정가와 어긋날 수 있어 이번
// 연동에서는 만들어내지 않는다 — 취소선 정가 표시 여부는 제품 정책 확인 후 정한다.

import { apiRequest } from "@/shared/api/client";

export type ProductSort = "RECOMMEND" | "POPULAR" | "REVIEW" | "PRICE_DESC" | "PRICE_ASC";

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
