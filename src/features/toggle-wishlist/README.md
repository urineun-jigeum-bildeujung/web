# toggle-wishlist

상품의 하트를 눌러 찜을 켜고 끈다. 로그인하지 않았으면 찜 대신 로그인 필요 토스트만 띄운다 (#483, #542).

| 파일 | 설명 |
| --- | --- |
| `index.ts` | 공개 API — `useToggleWishlist`·`useWishedProductIds`·`toWishlistItem`·`CardHeartButton` |
| `model/use-toggle-wishlist.ts` | 로그인 여부를 보고 찜을 뒤집거나(`entities/wishlist`의 `toggle`) 로그인 필요 토스트를 띄운다(`useRequireSession`). 찜 조회를 켤지(`signedIn`)도 함께 준다 |
| `model/use-toggle-wishlist.test.tsx` | 로그인·로그아웃·아직 모름 세 경우 |
| `model/use-wished-product-ids.ts` | 카드를 늘어놓는 화면이 쓸 찜한 상품 번호와 받는 중인지. 로그인했을 때만 전체 찜 목록을 읽는다 |
| `model/use-wished-product-ids.test.tsx` | 로그인이면 번호를 뽑고, 로그아웃이면 부르지 않고 남은 캐시도 쓰지 않는지, 받는 중을 알리는지 |
| `model/to-wishlist-item.ts` | 화면의 상품 값을 찜 목록 한 줄로 옮긴다. 정가가 없으면 판매가로 채운다 |
| `model/to-wishlist-item.test.ts` | 정가가 없을 때와 있을 때 |
| `ui/card-heart-button.tsx` | 상품 카드 사진 위의 찜 하트(어두운 원판 + 흰 하트). 검색 결과·함께 보면 좋은 상품·메인 종류 탭(#534)·메인 맞춤 상품(#611)이 쓴다. 찜 여부를 받는 동안(`loading`)은 막고 하트 자리에 대기를 보인다 |
| `ui/card-heart-button.test.tsx` | 눌림 상태와 누르면 토글을 부르는지, 받는 동안 막히는지 |

## 짚어둘 것

**하트의 모양은 대개 화면이 그린다.** 하단 줄의 48px 네모처럼 시안마다 달라 이 슬라이스는 동작을 준다. 다만 카드 사진 위의 하트(어두운 원판 + 흰 하트)는 검색 결과와 함께 보면 좋은 상품이 같은 시안이라 `CardHeartButton` 한 벌로 둔다.

**찜 여부는 화면이 읽는다.** 상품 하나를 보는 화면은 `useQueryWishlistStatus`, 카드를 늘어놓는 화면은 전체 찜 목록(`useQueryWishlist`)이다. 둘 다 `signedIn`일 때만 켠다. 두 캐시를 함께 맞추는 일은 `entities/wishlist`가 한다.

**찜 여부를 받는 동안은 하트를 누를 수 없다(#493 리뷰).** PATCH가 토글이라, 받기 전의 빈 하트를 보고 찜하려고 누르면 이미 찜한 상품의 찜이 서버에서 지워진다. 화면은 받는 동안 하트를 막고 그 자리에 대기(`LoadingSwap`)를 보인다.

**로그인 여부를 아직 모를 때(서버 렌더·하이드레이션 중) 누르면 아무것도 하지 않는다.** 로그인한 사람을 로그인 화면으로 보내지 않는다.

**담김 안내는 화면이 띄운다.** 안내가 있는 곳(하단 줄)과 없는 곳(카드)이 시안마다 달라, `toggle`이 true를 돌려줄 때 화면이 정한다.
