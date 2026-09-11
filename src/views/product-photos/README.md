# product-photos

후기에 달린 사진만 모아 보는 화면. 격자에서 고르면 그 사진을 남긴 후기가 함께 열린다.

- **라우트**: `/products/[productId]/photos` — `src/app/products/[productId]/photos/page.tsx`
- **조립**: `entities/review`(`ReviewCard`·목데이터) · `shared/ui`의 `page-header` · `empty-state` · `bottom-action-bar` · `button`
- **상태**: 보고 있는 사진은 URL 쿼리 `review`(후기 번호) · `photo`(그 후기의 몇 번째). 사진 한 장을 가리킬 주소가 있어야 공유되고 뒤로가기로 격자에 돌아온다
- **참고**: 와이어프레임 기준(`상품 상세_사진 리뷰 모음 화면`·`_리뷰 탭`). 사진은 받을 곳이 없어 자리만 잡는다

| 파일 | 설명 |
| --- | --- |
| `ui/product-photos-view.tsx` | 3열 격자와 상세 열기 |
| `ui/product-photos-view.test.tsx` | 격자에서 상세로 가는 길, 주소로 들어왔을 때, 범위를 벗어난 값 |
| `ui/photo-viewer.tsx` | 사진 상세. 크게 보이고 그 후기와 하단 CTA를 붙인다 |
| `index.ts` | 공개 API |

## 왜 사진만 따로 모으나

사료 후기에서는 사진이 글보다 많은 것을 말한다. 알갱이 크기, 변 상태, 아이가 먹는 모습은 글로 옮기기 어렵다. 목록을 훑으며 사진을 찾는 대신 사진만 모아 두면 원하는 장면을 먼저 찾고 그 후기로 들어갈 수 있다.

상세에 하단 CTA를 그대로 둔 것도 같은 이유다. 사진이 마음에 들면 그 자리에서 상품으로 갈 수 있어야 한다.

## 아직 없는 것

- 사진은 받을 곳이 없어 몇 장인지만 알고 자리를 잡는다. API가 붙으면 `next/image`로 바꾸고 목록은 lazy, 첫 화면은 priority를 건다
- 좌우로 미는 제스처. 지금은 화살표 버튼으로만 넘긴다
