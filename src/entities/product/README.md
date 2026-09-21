# entities/product

상품을 표현하는 것들. 백엔드 도메인의 상품에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `api/products.ts` | 검색 결과 조회(`searchProducts`)와 상품 요약 조회(`getProductSummary`). 일반 async 함수라 서버·클라이언트 어디서나 쓴다(#282) |
| `api/use-query-product-summary.ts` | 상품 하나의 이름·대표 사진을 받는 훅. 리뷰 작성의 상품 줄이 쓴다 |
| `api/products.test.ts` | 요청 파라미터 조립·응답 필드 매핑 단위 테스트 |
| `api/time-deals.ts` | 타임딜 목록 조회(`getTimeDeals`). 백엔드가 딜 묶음 개수를 제한하지 않아 배열 그대로 보존한다(#282) |
| `api/time-deals.test.ts` | 요청 파라미터·다중 딜 묶음 보존·`stockBadge` 매핑 단위 테스트 |
| `model/mock-detail-product.ts` | API 연동 전 상품 상세·비교 화면이 공유하는 상품 요약 목데이터 |
| `ui/match-score-badge.tsx` | 적합도 점수 배지. 점수와 함께 구간 문구를 읽히고, 재지 못했으면 "정보 확인 중" |
| `ui/compare-table.tsx` | 두 상품의 스펙을 항목별로 견주는 표 (`comp_001`) |
| `ui/compare-slot.tsx` | 비교할 자리 하나. 비어 있으면 담으라고 안내하고, 채워지면 적합도 우열과 장바구니 추가를 보여준다 (`comp_001`, `comp_001_empty`) |
| `ui/compare-slot.test.tsx` | 빈 자리 안내, 적합도 유무·우열, 장바구니·빼기 콜백 |
| `ui/product-option-sheet.tsx` | 목록에서 바로 구성과 수량을 골라 담는 바텀시트 (타임딜_옵션 선택 바텀시트) |
| `index.ts` | 공개 API |

## 아직 없는 것

`api/products.ts`는 검색 목록 조회만 있다. 상품 상세·목록(비검색) 조회, 정가(`originalPrice`) 표시 정책은
아직 없다 — 서버 응답에 정가 필드가 없고 `discountRate`에서 역산하면 반올림 오차로 실제 값과
어긋날 수 있어(#282) 만들어내지 않았다. 조회 훅(React Query)은 만들지 않았다 — 상품·타임딜은
공개 데이터라 서버 컴포넌트에서 직접 fetch하고, 진짜 클라이언트 재조회가 필요한 지점(더보기 등)이
생기면 그때 훅을 얹는다.

상품 카드는 두지 않는다. 화면마다 보여주는 항목이 아홉 가지로 갈려, 조각(`shared/ui`의 `Price`·`ProductSummary`)을 화면에서 조립한다. 근거는 [component-convention](../../../docs/conventions/component-convention.md)의 "공용으로 올리는 기준"을 본다.

**점수가 없는 것은 0점이 아니다.** 영양 정보가 등록되지 않아 계산하지 못한 상품에는 `score={null}`을 준다. 0으로 내려보내면 "확인이 필요해요"로 읽혀 궁합이 나쁜 상품처럼 보인다 — 재 봤더니 안 맞는 것과 아직 재지 않은 것은 다른 이야기다. 판정이 아니라 모른다는 뜻이라 채우지 않고 테두리만 둔다.

**`compare-slot.tsx`의 간격은 임의로 고르지 않았다.** 채워진 자리는 이미지·이름/가격을 12px 바깥·4px 안쪽 두 겹으로 묶고, 빈 자리는 8px 한 겹으로 묶는다(시안 1568-70143·1117-6319). 서로 다른 간격처럼 보이지만, 한쪽만 채워졌을 때 두 "장바구니 추가"/"상품 추가하기" 버튼이 같은 줄에 나란히 놓이도록 시안이 정확히 맞춰 둔 값이라 통일하면 오히려 어긋난다.
