// 거르기 조건에 걸리는 후기 수만 묻는 훅. 거르기 시트의 "리뷰 N개 보기"가 쓴다 (#472).

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getProductReviews, type ProductReviewConditions } from "./reviews";

/**
 * 조건에 걸리는 후기 수.
 *
 * 개수만 필요해 한 장(`size=1`)만 받고 `totalCount`를 읽는다. 조건을 바꾸는 동안에는
 * 앞서 받은 수를 그대로 보여 숫자가 비었다 찼다 하지 않는다.
 */
export function useQueryProductReviewCount({
  productId,
  conditions,
  enabled,
}: {
  productId: string;
  conditions: ProductReviewConditions;
  /** 시트가 닫혀 있으면 묻지 않는다 */
  enabled: boolean;
}) {
  const query = useQuery({
    queryKey: QUERY_KEYS.review.byProduct(productId, { conditions, countOnly: true }),
    queryFn: () =>
      getProductReviews({ productId, sort: "recommend", page: 0, size: 1, conditions }).then(
        (page) => page.totalCount,
      ),
    enabled,
    placeholderData: keepPreviousData,
  });

  return {
    /** 아직 한 번도 받지 못했으면 `undefined` */
    count: query.data,
    /** 조건이 바뀌어 다시 세는 중 */
    isCounting: query.isFetching,
  };
}
