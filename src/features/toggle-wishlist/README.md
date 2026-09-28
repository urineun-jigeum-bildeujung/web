# toggle-wishlist

상품의 하트를 눌러 찜을 켜고 끈다. 로그인하지 않았으면 찜 대신 로그인으로 보낸다 (#483).

| 파일 | 설명 |
| --- | --- |
| `index.ts` | 공개 API — `useToggleWishlist` |
| `model/use-toggle-wishlist.ts` | 로그인 여부를 보고 찜을 뒤집거나(`entities/wishlist`의 `toggle`) 로그인으로 보낸다. 찜 조회를 켤지(`signedIn`)도 함께 준다 |
| `model/use-toggle-wishlist.test.tsx` | 로그인·로그아웃·아직 모름 세 경우 |

## 짚어둘 것

**하트의 모양은 화면이 그린다.** 하단 줄의 48px 네모, 카드 사진 위의 원판처럼 시안마다 달라 이 슬라이스는 동작만 준다.

**찜 여부는 화면이 읽는다.** 상품 하나를 보는 화면은 `useQueryWishlistStatus`, 카드를 늘어놓는 화면은 전체 찜 목록(`useQueryWishlist`)이다. 둘 다 `signedIn`일 때만 켠다. 두 캐시를 함께 맞추는 일은 `entities/wishlist`가 한다.

**로그인 여부를 아직 모를 때(서버 렌더·하이드레이션 중) 누르면 아무것도 하지 않는다.** 로그인한 사람을 로그인 화면으로 보내지 않는다.

**담김 안내는 화면이 띄운다.** 안내가 있는 곳(하단 줄)과 없는 곳(카드)이 시안마다 달라, `toggle`이 true를 돌려줄 때 화면이 정한다.
