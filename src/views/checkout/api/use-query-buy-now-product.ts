// "바로 구매"할 상품 한 건을 불러온다. 일반 상품은 상품 상세, 타임딜은 딜 상세다 (#520).
//
// 딜가는 딜 상세에만 온다 — 일반 상품 상세는 딜 중이어도 정가를 준다(#484). 그래서 종류에 따라
// 부르는 곳을 가른다. 일반 상품의 캐시 키는 상품 상세 조회(`useQueryProductDetails`)와 같다.

import { useQuery } from "@tanstack/react-query";

import type { BuyNow } from "@/entities/cart";
import { getProductDetail, getTimeDealDetail } from "@/entities/product";
import { QUERY_KEYS } from "@/shared/config/query-keys";

export function useQueryBuyNowProduct(buyNow: BuyNow | null) {
  const id = String(buyNow?.itemId ?? "");
  const isDeal = buyNow?.itemType === "TIME_DEAL";

  return useQuery({
    queryKey: isDeal ? QUERY_KEYS.timedeal.item(id) : QUERY_KEYS.product.detail(id),
    queryFn: () => (isDeal ? getTimeDealDetail(id) : getProductDetail(id)),
    // 바로 구매가 아니면 장바구니로 결제한다. 부를 것이 없다
    enabled: buyNow !== null,
  });
}
