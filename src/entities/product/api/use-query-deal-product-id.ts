// 타임딜 줄이 가리키는 상품 번호를 딜 상세에서 받는 훅. 줄을 눌러 상세로 갈 주소를 만드는 데 쓴다 (#563).
//
// **장바구니와 결제하기가 함께 쓴다.** 결제하기의 상품 줄도 누르면 상세로 가야 해서(QA No.47, #595)
// `views/cart`에서 여기로 내려왔다 — `views`끼리는 가져다 쓸 수 없다.
//
// **장바구니 응답에는 딜 아이템 번호만 있고 상품 번호가 없다**(백엔드 `CartItemResponse`). 딜가로 보이는
// 상세 주소는 상품 번호가 있어야 만든다(`/products/{상품}?dealItem={딜 아이템}`, #484). 그래서 공개
// API인 딜 상세를 부른다 — 딜 줄마다 한 번 나가고, 바로 구매(`use-query-buy-now-product`)와 같은 키라
// 캐시를 함께 쓴다. 백엔드에 줄마다 상품 번호를 달라고 하기 전에 있는 API로 떠안았다.

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getTimeDealDetail } from "./products";

/**
 * 딜 아이템의 상품 번호. `null`을 주면 부르지 않는다(일반 줄은 줄 번호가 곧 상품 번호다).
 *
 * **끝난 딜은 받지 못한다.** 딜 상세가 진행 중·예정인 딜만 보여 주고 나머지는 404다
 * (`TimeDealDetailService`). 그래서 부르는 쪽이 끝난 딜 줄(`DEAL_ENDED`)에는 `null`을 준다. 그 밖에
 * 받지 못한 경우도 `undefined`라 부르는 쪽이 링크를 걸지 않는다.
 */
export function useQueryDealProductId(dealItemId: number | null): number | undefined {
  const id = String(dealItemId ?? "");

  const { data } = useQuery({
    queryKey: QUERY_KEYS.timedeal.item(id),
    queryFn: () => getTimeDealDetail(id),
    select: (deal) => deal.productId,
    enabled: dealItemId !== null,
  });

  return data;
}
