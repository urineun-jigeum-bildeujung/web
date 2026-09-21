// 상품 하나의 이름·대표 사진을 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getProductSummary } from "./products";

/**
 * 리뷰 작성의 상품 줄처럼 상품이 무엇인지만 보이면 되는 자리가 쓴다.
 *
 * 상세 화면과 같은 키(`product.detail`)를 쓴다. 상세를 보고 후기를 쓰러 오면 이미 받은 것을 쓴다.
 */
export function useQueryProductSummary(productId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.product.detail(productId),
    queryFn: () => getProductSummary(productId),
  });

  return {
    product: query.data,
    isLoading: query.isPending,
    error: query.error,
  };
}
