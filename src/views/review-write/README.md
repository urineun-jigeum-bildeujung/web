# review-write

구매한 상품의 리뷰를 작성한다. 별점과 함께 아이의 실제 반응을 받는다.

- **라우트**: `/mypage/reviews/write` — `src/app/mypage/reviews/write/page.tsx`
- **조립**: `entities/pet`(`PetSwitcher`) · `shared/ui`의 `page-header` · `product-summary` · `chip-select` · `input` · `textarea` · `button`
- **상태**: URL 쿼리 `orderItemId`와 작성 폼 상태. API 계약 확정 전 미연동
- **참고**: 와이어프레임 기준(리뷰 작성 6화면). 같은 상품도 구매 건별로 구분해야 하므로 임시로 `orderItemId`를 사용한다. 실제 식별자와 필수값 처리 방식은 API 계약과 함께 확정한다

| 파일 | 설명 |
| --- | --- |
| `ui/review-write-view.tsx` | 화면 조립 |
| `ui/review-write-view.test.tsx` | 무엇을 채워야 등록되는지, 아이의 반응을 받는지 |
| `ui/rating-input.tsx` | 별을 눌러 점수를 매긴다 |
| `ui/photo-picker.tsx` | 사진을 최대 세 장 붙이고 뺀다 |
| `ui/photo-picker.test.tsx` | 장수 제한·빼기·미리보기 주소 정리 |
| `index.ts` | 공개 API |

## 짚어둘 것

**별점 매기기와 사진 첨부는 이 화면에만 있어 여기 둔다.** 두 곳 이상에서 되풀이될 때 `shared/ui`로 올린다 — 기준은 [component-convention](../../../docs/conventions/component-convention.md)의 "공용으로 올리는 기준"을 본다. `shared/ui/rating`은 보여주기만 하므로 매기는 것을 따로 만들었다.

**별점은 정수로만 받는다.** 시안은 3.5개로 그려져 있지만, 반쪽을 누르게 하려면 별 하나를 좌우로 갈라야 하고 그러면 탭 영역이 22px로 줄어 최소 44px 기준을 못 맞춘다.

**어느 아이가 먹었는지를 필수로 받는다.** 같은 사료라도 아이마다 반응이 달라, 아이를 모르면 그 답을 다음 추천에 쓸 수 없다. 사진만 선택이다.

**사진은 고르는 즉시 올리지 않고 파일만 들고 있는다.** API를 연동하면 등록 요청에 함께 실어 보낼 자리다 — 미리 올려 두면 쓰다 말았을 때 서버에 사진만 남는다. `shared/ui/avatar-uploader`와 같은 판단이다. 지금은 등록해도 아무것도 보내지 않고 완료 화면으로만 넘어간다.
