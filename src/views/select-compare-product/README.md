# views/select-compare-product

비교할 사료를 고르는 화면. 와이어프레임 `comp_011`·`comp_011_선택`·`comp_011_searching`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/select-compare-product-view.tsx` | 검색과 격자 목록. 하나를 고르면 완료가 켜진다 |
| `ui/select-compare-product-view.test.tsx` | 고르기 전후와 검색 중 상태를 본다 |
| `index.ts` | 공개 API |

## 라우트

`/compare/select` — `src/app/compare/select/page.tsx`

**경로는 임시다.**

## 검색 중에는 제목을 숨긴다

기본 목록의 제목이 "최근 봤어요"인데, 검색 결과에 그 제목을 달면 틀린 말이 된다. 시안 `comp_011_searching`도 제목 없이 결과만 보여준다.

## 아직 없는 것

고른 상품을 비교 화면으로 넘기는 길이 없다. 화면 간 전달 방식은 라우터 구조가 정해진 뒤에 붙인다.
