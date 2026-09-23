# entities/wishlist

찜한 상품. 좋아요 화면의 찜 탭이 쓴다.

| 파일 | 설명 |
| --- | --- |
| `api/wishlist.ts` | 카테고리별 목록 조회(`getWishlist`)·토글(`toggleWishlist`) 요청 함수와 `WishlistItem` 타입 |
| `api/wishlist.test.ts` | 요청 파라미터 조립·응답 필드 매핑 단위 테스트 |
| `api/use-query-wishlist.ts` | 찜 목록을 가져오는 훅. `enabled`로 조건부 조회한다 |
| `api/use-mutate-wishlist.ts` | 찜 해제 훅. 전체·카테고리별 캐시를 모두 낙관적으로 갱신한다 |
| `api/use-mutate-wishlist.test.tsx` | 낙관적 갱신·실패 시 복구·재시도 안 함을 실제 `QueryClient`로 본다 |
| `index.ts` | 공개 API |

## 알아둘 것

**카테고리 필터는 서버가 한다.** 응답(`WishlistItemResponse`)에 상품의 카테고리가 없어 프론트가 다시 거를 수 없다 — `getWishlist(categoryCode)`의 `categoryCode`는 이미 백엔드 `CategoryCode` 값이어야 한다(`entities/product`의 `CATEGORY_TO_API`로 변환한 값). 이 엔티티는 화면의 URL 값(`food` 등)을 모른다 — FSD상 엔티티끼리는 서로 import할 수 없어(`shared`만 가능) 그 변환을 여기서 가질 수 없다.

**전체 조회와 카테고리별 조회, 캐시가 둘로 갈린다.** 찜한 상품이 하나도 없을 때와 고른 카테고리에만 없을 때를 화면이 다른 문구로 보여주는데, 카테고리별 조회 하나로는 그 둘을 가를 수 없다(#390). 그래서 화면은 `useQueryWishlist()`(전체)와 `useQueryWishlist(categoryCode, { enabled: ... })`(카테고리)를 함께 쓴다.

**PATCH는 삭제가 아니라 토글이다.** 응답의 `wished`를 그대로 믿지 않는다 — 중복 요청이나 오래된 상태에서 `true`가 돌아올 수 있다. `useMutateWishlist`는 낙관적으로 먼저 빼고, 실패하면 그 상품만 원래 있던 캐시·위치로 되돌린다(다른 상품의 성공한 변경은 건드리지 않는다). 진행 중인 해제가 모두 끝났을 때 전체·카테고리별 캐시를 무효화해 서버 상태로 재동기화하고, 재시도는 쓰지 않는다 — 먼저 끝난 하나가 곧장 재조회하면 아직 반영되지 않은 뒤 상품이 담긴 목록을 받아 덮어쓴다.

**변경 실패 토스트는 여기서 띄우지 않는다.** `AppProviders`의 `MutationCache.onError`가 모든 변경 실패를 알린다 — `entities/cart`와 같다.

## 아직 없는 것

**정가(`originalPrice`) 표시가 없다.** 서버 응답에 필드가 없다 — `product-service` 내부 응답엔 있지만 `member-service`가 받는 내부 DTO에 그 필드가 선언돼 있지 않아 역직렬화 단계부터 못 받는다(#390). 백엔드에 필드 추가를 요청해 뒀다. 오면 `WishlistItem`·`toWishlistItem`에 반영한다.

**리뷰 점수·후기 수는 항상 비어 있다.** 응답 필드(`reviewScore`·`reviewCount`)는 있지만 백엔드가 "리뷰 벌크조회 API 연동 전까지 임시로 비워둠"이라 늘 `null`/`0`이다 — 그래서 `WishlistItem`에 아예 옮기지 않는다. 좋아요 화면의 찜 탭 카드는 애초에 이 값을 보여주지 않아 지금은 문제되지 않는다.
