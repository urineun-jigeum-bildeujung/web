// 결제를 마친 장바구니 줄을 빼는 훅. 승인이 끝난 뒤 주문 완료 화면이 부른다 (#457).
//
// **서버는 결제가 끝나도 장바구니를 비우지 않는다.** 그대로 두면 방금 산 상품이 장바구니에 남아
// 다시 결제될 수 있어, 결제 화면이 주문과 함께 적어 둔 줄을 여기서 뺀다.
//
// **빼기 실패를 화면에 알리지 않는다.** 결제는 이미 끝났고, 여기서 실패 토스트가 뜨면 방금 한
// 결제가 잘못된 것처럼 읽힌다. 그래서 전역 실패 토스트가 붙는 `useMutation`을 쓰지 않고 직접
// 부른 뒤 오류는 기록만 한다. 남은 줄은 장바구니에서 직접 뺄 수 있다.

"use client";

import { useQueryClient } from "@tanstack/react-query";

import { removeCartItem, type CartItemRef } from "@/entities/cart";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { reportError } from "@/shared/lib/report-error";

/** 줄을 받아 장바구니에서 빼고, 장바구니 캐시를 서버가 가진 것으로 맞추는 함수를 돌려준다 */
export function useRemovePaidCartItems() {
  const queryClient = useQueryClient();

  return async (items: CartItemRef[]) => {
    // 한 줄이 실패해도 나머지는 뺀다. 이미 빠진 줄은 서버가 성공(204)으로 돌려준다 — 없는 줄을
    // 지워도 막지 않는다(`RedisCartRepository.remove`의 HDEL)
    const results = await Promise.allSettled(items.map((item) => removeCartItem(item)));
    for (const result of results) {
      if (result.status === "rejected") {
        reportError("checkout.removePaidCartItems", result.reason);
      }
    }
    // 뺀 것과 못 뺀 것 모두 서버가 가진 것으로 맞춘다. 장바구니 뱃지와 화면이 다음에 새로 받는다
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart.all });
  };
}
