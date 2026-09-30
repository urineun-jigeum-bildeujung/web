# product-photos

후기에 달린 사진만 모아 보는 화면. 격자에서 고르면 그 사진을 남긴 후기가 함께 열린다.

- **라우트**: `/products/[productId]/photos` — `src/app/(constrained)/(member)/products/[productId]/photos/page.tsx`. 로그인해야 열린다(#542)
- **조립**: `features/toggle-wishlist` · `entities/wishlist`(`useQueryWishlistStatus`) · `entities/review`(`ReviewCard` · 사진·상세 조회 훅 · 도움돼요 훅) · `shared/ui`의 `page-header` · `empty-state` · `bottom-action-bar` · `button` · `skeleton`
- **입력**: `productId`만 받는다. 사진은 `GET /reviews/products/{id}/photos`로 쪽 단위로 잇는다
- **상태**: 뷰어 하단의 찜 하트는 서버의 찜 여부다(#483). 보고 있는 사진은 URL 쿼리 `photo`(**후기 번호**) · `n`(그 후기의 몇 번째). 전에는 배열 순번이었는데 쪽을 이어 받으면 같은 번호가 다른 사진을 가리켜 바꿨다 (#339)
- **참고**: 와이어프레임 기준(`상품 상세_사진 리뷰 모음 화면`·`_리뷰 탭`)

| 파일 | 설명 |
| --- | --- |
| `ui/product-photos-view.tsx` | 3열 격자와 상세 열기 |
| `ui/product-photos-view.test.tsx` | 격자에서 상세로 가는 길, 주소로 들어왔을 때, 범위를 벗어난 값, 카드가 없는 값을 지어내지 않는지, 카드의 도움돼요를 누르면 그 후기를 넘기는지 |
| `ui/photo-viewer.tsx` | 사진 상세. 크게 보이고 그 후기와 하단 CTA를 붙인다. 카드는 공개 리뷰 상세로 채운다 |
| `index.ts` | 공개 API |

## 왜 사진만 따로 모으나

사료 후기에서는 사진이 글보다 많은 것을 말한다. 알갱이 크기, 변 상태, 아이가 먹는 모습은 글로 옮기기 어렵다. 목록을 훑으며 사진을 찾는 대신 사진만 모아 두면 원하는 장면을 먼저 찾고 그 후기로 들어갈 수 있다.

상세에 하단 CTA를 그대로 둔 것도 같은 이유다. 사진이 마음에 들면 그 자리에서 상품으로 갈 수 있어야 한다.

## 아직 없는 것

- 좌우로 미는 제스처. 지금은 화살표 버튼으로만 넘긴다
