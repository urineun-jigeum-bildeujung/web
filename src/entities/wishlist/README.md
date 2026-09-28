# entities/wishlist

찜한 상품. 좋아요 화면의 찜 탭과, 상품 화면들의 하트(`features/toggle-wishlist`)가 쓴다.

| 파일 | 설명 |
| --- | --- |
| `api/wishlist.ts` | 카테고리별 목록 조회(`getWishlist`)·상품 하나의 찜 여부(`getWishlistStatus`)·토글(`toggleWishlist`) 요청 함수와 `WishlistItem` 타입 |
| `api/wishlist.test.ts` | 요청 파라미터 조립·응답 필드 매핑 단위 테스트 |
| `api/use-query-wishlist.ts` | 찜 목록을 가져오는 훅. `enabled`로 조건부 조회한다 |
| `api/use-query-wishlist-status.ts` | 상품 하나의 찜 여부를 가져오는 훅. 로그인했을 때만 `enabled`로 켜고, 꺼 두면 남은 캐시를 내주지 않는다. 받는 동안(`isLoading`)은 화면이 하트를 막는다 — 토글이라 모르는 채로 누르면 서버의 찜이 지워진다 (#483) |
| `api/use-query-wishlist-status.test.tsx` | 받은 여부를 돌려주는지, 꺼져 있으면 묻지 않는지, 받는 중을 알리는지 |
| `api/use-mutate-wishlist.ts` | 찜 해제(`remove`)·토글(`toggle`) 훅. 찜 목록(전체·카테고리별)과 찜 여부를 함께 낙관적으로 갱신한다 |
| `api/use-mutate-wishlist.test.tsx` | 해제·토글의 낙관적 갱신·실패 시 복구·재동기화 시점·재시도 안 함을 실제 `QueryClient`로 본다 |
| `index.ts` | 공개 API |

## 알아둘 것

**카테고리 필터는 서버가 한다.** 응답(`WishlistItemResponse`)에 상품의 카테고리가 없어 프론트가 다시 거를 수 없다 — `getWishlist(categoryCode)`의 `categoryCode`는 이미 백엔드 `CategoryCode` 값이어야 한다(`entities/product`의 `CATEGORY_TO_API`로 변환한 값). 이 엔티티는 화면의 URL 값(`food` 등)을 모른다 — FSD상 엔티티끼리는 서로 import할 수 없어(`shared`만 가능) 그 변환을 여기서 가질 수 없다.

**전체 조회와 카테고리별 조회, 캐시가 둘로 갈린다.** 찜한 상품이 하나도 없을 때와 고른 카테고리에만 없을 때를 화면이 다른 문구로 보여주는데, 카테고리별 조회 하나로는 그 둘을 가를 수 없다(#390). 그래서 화면은 `useQueryWishlist()`(전체)와 `useQueryWishlist(categoryCode, { enabled: ... })`(카테고리)를 함께 쓴다.

**찜 여부는 두 곳에서 온다(#483).** 상품 하나를 보는 화면(상세·사진 모아보기·리뷰 상세)은 `getWishlistStatus`를, 여러 상품을 늘어놓는 화면(검색 결과·함께 보면 좋은 상품)은 전체 찜 목록을 읽는다. 목록 화면이 상품마다 여부를 물을 수 없고, 상세가 목록 전체를 받는 것은 백엔드가 상품·리뷰 서비스까지 부르는 무거운 요청이다. **그래서 해제든 토글이든 두 캐시를 함께 먼저 바꾸고 함께 무효화한다** — `staleTime`이 60초라 한쪽만 바꾸면 1분 안에 돌아온 화면이 틀린 하트를 보이고, 다음 누름이 반대로 뒤집힌다. 찜 여부 키는 찜 목록 아래에 두지 않는다 — 목록 캐시를 모두 도는 이 훅이 그 아래를 배열로 여긴다.

**토글로 켤 때 목록에는 카드가 준 줄만 넣는다.** 가격 없는 줄을 넣으면 좋아요 탭이 재동기화 전까지 0원을 그린다. 값이 없는 화면(사진 모아보기·리뷰 상세)은 목록을 재동기화에 맡긴다. 카테고리별 목록에는 넣지 않는다 — 응답에 상품의 카테고리가 없다.

**PATCH는 삭제가 아니라 토글이다.** 응답의 `wished`를 그대로 믿지 않는다 — 중복 요청이나 오래된 상태에서 `true`가 돌아올 수 있다. `useMutateWishlist`는 낙관적으로 먼저 빼고, 실패하면 그 상품만 원래 있던 캐시·위치로 되돌린다(다른 상품의 성공한 변경은 건드리지 않는다). 진행 중인 해제·토글이 모두 끝났을 때 찜 목록과 찜 여부를 무효화해 서버 상태로 재동기화하고, 재시도는 쓰지 않는다 — 먼저 끝난 하나가 곧장 재조회하면 아직 반영되지 않은 뒤 상품이 담긴 목록을 받아 덮어쓴다.

**변경 실패 토스트는 여기서 띄우지 않는다.** `AppProviders`의 `MutationCache.onError`가 모든 변경 실패를 알린다 — `entities/cart`와 같다.

**정가는 늘 온다.** 할인하지 않는 상품도 할인율 계산 때문에 `originalPrice`를 저장해 둬, 그때는 `price`와 같은 값이 온다(백엔드 확인, #390). 두 값이 같으면 `calcDiscountRate`가 0을 돌려줘 카드가 취소선·할인율을 그리지 않는다 — 찜 응답엔 `discountRate` 필드가 없어 상품 목록과 달리 두 값을 비교해 판단한다.

## 아직 없는 것

**리뷰 점수·후기 수는 항상 비어 있다.** 응답 필드(`reviewScore`·`reviewCount`)는 있지만 백엔드가 "리뷰 벌크조회 API 연동 전까지 임시로 비워둠"이라 늘 `null`/`0`이다 — 그래서 `WishlistItem`에 아예 옮기지 않는다. 좋아요 화면의 찜 탭 카드는 애초에 이 값을 보여주지 않아 지금은 문제되지 않는다.
