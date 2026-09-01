# views/product-compare

두 사료를 항목별로 견주는 화면. 와이어프레임 `comp_001`·`comp_001_empty`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/product-compare-view.tsx` | 두 자리와 비교표를 조립한다. 한쪽이라도 비면 표를 감춘다 |
| `ui/product-compare-view.test.tsx` | 자리가 비었을 때의 화면 변화를 본다 |
| `index.ts` | 공개 API |

## 라우트

`/compare` — `src/app/compare/page.tsx`

## 상태를 어디에 두었나

고르기 화면에서 전달된 `slot`·`product`는 URL 쿼리로 읽고, 화면에 담긴 두 상품은 API 연동 전까지 컴포넌트 상태로 든다. 상품을 빼면 그 자리가 비면서 비교표가 사라진다.

## 아직 없는 것

- 장바구니 담기는 화면이 없어 버튼만 있다
- 비교 항목 아홉 개는 목 데이터다. API 계약이 나오면 상품 스펙에서 채운다
