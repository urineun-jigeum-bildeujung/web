// 담아 둔 가짓수. 헤더 장바구니 뱃지가 본다. 장바구니 화면과 같은 캐시를 써 담거나 빼면 바로 바뀐다.
//
// **로그인 여부는 부르는 쪽이 `enabled`로 준다.** 여기서 `useHasSession`을 부르면 이 슬라이스의
// 공개 API를 서버 페이지(`app/payment/page.tsx` → `views/checkout` 모델)가 들이면서
// `useSyncExternalStore`가 서버 컴포넌트 그래프에 들어가 빌드가 깨진다(#470).

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getCart } from "./cart";

type UseQueryCartCountOptions = {
  /** 거짓이면 부르지 않고 0이다. 헤더는 로그인하지 않은 메인에도 있어 세션으로 건다 */
  enabled?: boolean;
};

/**
 * 장바구니에 담긴 줄 수.
 *
 * 같은 상품을 여러 개 담아도 한 줄로 센다. 뱃지는 몇 가지를 담았는지를 알린다.
 */
export function useQueryCartCount({ enabled = true }: UseQueryCartCountOptions = {}): number {
  const query = useQuery({
    queryKey: QUERY_KEYS.cart.list(),
    queryFn: getCart,
    enabled,
    select: (cart) => cart.items.length,
  });
  // 꺼 두면 받아 둔 수도 내주지 않는다. 세션이 끊긴 뒤에 옛 뱃지가 남지 않게 한다(#470 리뷰)
  return enabled ? (query.data ?? 0) : 0;
}
