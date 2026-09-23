// 상품 하나의 이름·대표 사진을 받는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getProductSummary } from "./products";

/**
 * 리뷰 작성의 상품 줄처럼 상품이 무엇인지만 보이면 되는 자리가 쓴다.
 *
 * **상세와 키를 나눈다.** 같은 엔드포인트를 부르지만 캐시에 넣는 것은 이름·대표 사진만
 * 남긴 축약본이라, 상세 키에 얹으면 나중에 같은 키로 상세를 담을 때 모양이 어긋난다.
 */
export function useQueryProductSummary(productId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.product.summary(productId),
    queryFn: () => getProductSummary(productId),
  });

  return {
    product: query.data,
    isLoading: query.isPending,
    /** 실패 뒤 다시 시도하는 동안. 버튼의 대기 표시가 본다 */
    isRetrying: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
