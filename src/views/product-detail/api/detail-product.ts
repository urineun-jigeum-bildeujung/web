// 상세에 그릴 상품 한 건을 받는다. 타임딜에서 들어왔으면 딜가가 붙은 타임딜 상세를 받는다 (#484).
//
// 딜 정보는 일반 상품 상세(`/products/{id}`)에 오지 않는다 — 딜 중인 상품이어도 정가와 빈 딜
// 번호가 온다. 타임딜 상세(`/time-deals/items/{id}`)에서만 딜가와 딜 번호가 온다. 그래서 타임딜
// 목록·메인 타임딜의 링크가 딜 아이템 번호(`dealItem`)를 함께 넘긴다.

import { ApiError } from "@/shared/api/client";
import { getProductDetail, getTimeDealDetail, type ProductDetail } from "@/entities/product";

/** 없는 것과 그 밖의 실패는 다르다. 후자는 그대로 던져 오류 경계가 받는다 */
function nullIfNotFound(error: unknown): null {
  if (error instanceof ApiError && error.status === 404) return null;
  throw error;
}

/**
 * 딜이 끝났거나(404) 주소의 상품과 다른 딜이면 일반 상세로 둔다. 정가로 보이는 편이 남의 상품
 * 딜가를 붙이는 것보다 낫다. 상품 자체가 없으면 null이다 — 라우트가 404로 보낸다.
 */
export async function getDetailProduct(
  productId: string,
  dealItemId?: string,
): Promise<ProductDetail | null> {
  if (dealItemId) {
    const deal = await getTimeDealDetail(dealItemId).catch(nullIfNotFound);
    if (deal && String(deal.productId) === productId) return deal;
  }
  return getProductDetail(productId).catch(nullIfNotFound);
}
