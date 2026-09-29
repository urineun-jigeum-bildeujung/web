// 여러 상품의 상세를 한꺼번에 받는 훅. 최근 본 상품처럼 번호만 쥔 목록이 카드를 그릴 때 쓴다 (#509).
//
// 번호 여럿을 한 번에 주는 공개 API가 없어 상품마다 상세를 부른다(최근 본 상품은 최대 9개).
// 키는 상세 키(`QUERY_KEYS.product.detail`)라 같은 상품을 다시 그릴 때는 캐시를 쓴다.

import { useQueries } from "@tanstack/react-query";

import { ApiError } from "@/shared/api/client";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getProductDetail, type ProductDetail } from "./products";

export type ProductDetailEntry = {
  productId: number;
  /** 받았으면 있다 */
  product?: ProductDetail;
  isLoading: boolean;
  /** 없어진 상품(404). 목록에서 조용히 빼면 된다 — 실패로 알릴 일이 아니다 */
  notFound: boolean;
  /** 404가 아닌 실패. 다시 시도할 수 있다 */
  isError: boolean;
};

export function useQueryProductDetails(productIds: number[]) {
  const results = useQueries({
    queries: productIds.map((productId) => ({
      // 리뷰 작성의 요약 훅과 같게 번호를 문자열로 둔다. 숫자와 섞이면 같은 상품이 두 칸을 차지한다
      queryKey: QUERY_KEYS.product.detail(String(productId)),
      queryFn: () => getProductDetail(String(productId)),
    })),
  });

  const entries: ProductDetailEntry[] = productIds.map((productId, index) => {
    const result = results[index];
    const notFound = result.error instanceof ApiError && result.error.status === 404;
    return {
      productId,
      product: result.data,
      isLoading: result.isPending,
      notFound,
      isError: result.isError && !notFound,
    };
  });

  return {
    entries,
    /** 404가 아닌 실패만 다시 부른다 */
    refetchFailed: () => {
      results.forEach((result, index) => {
        if (entries[index].isError) void result.refetch();
      });
    },
  };
}
