# entities/cart

담아 둔 상품. 장바구니 화면과 결제 흐름이 함께 쓴다.

**`views/cart` 안에 있다가 여기로 내려왔다.** 결제 화면(`views/checkout`)이 주문에 실을 품목을 같은 조회에서 가져와야 하는데, `views/` 안에 두면 같은 레이어 간 참조라 막힌다 (AGENTS.md 4절, #255).

| 파일 | 설명 |
| --- | --- |
| `api/cart.ts` | 조회·**담기**·수량 변경·빼기 요청 함수와 `Cart`·`CartItem` 타입 |
| `api/use-query-cart.ts` | 장바구니를 가져오는 훅 |
| `api/use-query-cart-count.ts` | 담은 가짓수(줄 수). 헤더 장바구니 뱃지가 쓴다. 같은 캐시를 써 담거나 빼면 바로 바뀐다. **로그인 여부는 부르는 쪽이 `enabled`로 준다** — 여기서 `useHasSession`을 부르면 서버 페이지(`app/payment`)가 이 공개 API를 들이면서 `useSyncExternalStore`가 서버 컴포넌트 그래프에 들어가 깨진다 (#470) |
| `api/use-query-cart-count.test.tsx` | 꺼 두면 부르지 않는지, 껐다가는 받아 둔 수를 내주지 않는지(세션이 끊긴 뒤 옛 뱃지가 남지 않게), 수량이 아니라 줄 수를 세는지 |
| `api/use-mutate-cart-item.ts` | 담기·수량 변경·빼기 훅. **담기만 낙관적 갱신을 걸지 않는다** — 서버가 줄을 만들어야 짝이 확정된다. 빼기는 `remove`(낙관적)와 `removeAsync`(기다림) 둘을 낸다 — 서버에서 빠진 것을 확인한 뒤 화면 상태를 바꿔야 하는 자리가 뒤쪽을 쓴다 (#316). 수량을 먼저 그릴 때 합계(`subtotal`)도 같이 바꾸고, 요청이 겹치면 마지막 것이 끝날 때만 다시 받는다 (#427) |
| `api/use-mutate-cart-item.test.tsx` | 겹친 요청에서 다시 받는 때, 먼저 그리는 합계 |
| `index.ts` | 공개 API |

## 알아둘 것

**줄의 식별자가 둘이다.** `itemType`(`TIME_DEAL`·`NORMAL`)과 `itemId`가 늘 짝으로 다닌다. 한 덩어리로 다뤄야 하는 자리에는 `cartItemKey()`를 쓴다.

**살 수 없는 줄이라고 내용이 늘 비지는 않는다.** 서버 `unavailableWithoutInfo`가 쓰이는 둘(`NOT_FOUND`·`TEMPORARILY_UNAVAILABLE`)만 이름·사진·금액이 `null`이고, 상품은 있는데 못 사는 경우(`OUT_OF_STOCK`·`DISCONTINUED`·`DEAL_ENDED`)는 **그 값들이 그대로 온다**(`unavailableWithInfo`). 그래서 내용 필드가 nullable이다. 어느 쪽이든 **주문에 실을 때는 걸러야 한다.**

**수량은 바뀐 값이 아니라 증감(`delta`)을 보낸다.** 스테퍼가 바뀐 값을 들고 있으므로 부르는 쪽이 이전 값과의 차를 계산한다. 증감이라 연달아 눌러 요청이 여러 번 나가도 서버에서 합쳐진다.

**변경 실패 토스트는 여기서 띄우지 않는다.** `AppProviders`의 `MutationCache.onError`가 모든 변경 실패를 알린다.
