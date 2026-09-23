# entities/product

상품을 표현하는 것들. 백엔드 도메인의 상품에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `api/products.ts` | 검색 결과 조회(`searchProducts`), 카테고리별 목록 조회(`getProducts`), 상품 상세 조회(`getProductDetail`)와 거기서 파생하는 요약(`getProductSummary`). 일반 async 함수라 서버·클라이언트 어디서나 쓴다(#282, #289, #413) |
| `api/use-query-product-summary.ts` | 상품 하나의 이름·대표 사진을 받는 훅. 리뷰 작성의 상품 줄이 쓴다 |
| `api/use-product-list.ts` | `getProducts`의 커서 페이지네이션("더 보기") 상태를 관리하는 훅. 첫 페이지는 서버가 준 값을 받고 다음 페이지만 이어 붙입니다(#289) |
| `api/use-product-list.test.ts` | 커서 이어 붙이기·중복 제거·실패 시 기존 목록 보존 단위 테스트 |
| `api/products.test.ts` | 요청 파라미터 조립·응답 필드 매핑 단위 테스트 |
| `api/time-deals.ts` | 타임딜 목록 조회(`getTimeDeals`). 백엔드가 딜 묶음 개수를 제한하지 않아 배열 그대로 보존한다(#282) |
| `api/time-deals.test.ts` | 요청 파라미터·다중 딜 묶음 보존·`stockBadge` 매핑 단위 테스트 |
| `model/category.ts` | 화면 카테고리 값 → 백엔드 `CategoryCode` 매핑(`CATEGORY_TO_API`). 홈·좋아요 등 여러 화면이 공유합니다(#390) |
| `model/category.test.ts` | snack→TREAT 등 매핑이 단순 대문자 변환이 아님을 고정 |
| `model/mock-detail-product.ts` | API 연동 전 상품 상세·비교 화면이 공유하는 상품 요약 목데이터 |
| `ui/match-score-badge.tsx` | 적합도 점수 배지. 점수와 함께 구간 문구를 읽히고, 재지 못했으면 "정보 확인 중" |
| `ui/compare-table.tsx` | 두 상품의 스펙을 항목별로 견주는 표 (`comp_001`) |
| `ui/compare-slot.tsx` | 비교할 자리 하나. 비어 있으면 담으라고 안내하고, 채워지면 적합도 우열과 장바구니 추가를 보여준다 (`comp_001`, `comp_001_empty`) |
| `ui/compare-slot.test.tsx` | 빈 자리 안내, 적합도 유무·우열, 장바구니·빼기 콜백 |
| `ui/product-option-sheet.tsx` | 목록에서 바로 구성과 수량을 골라 담는 바텀시트 (타임딜_옵션 선택 바텀시트) |
| `index.ts` | 공개 API |

## 상세 조회가 요약의 원본이다

`getProductDetail`이 `GET /products/{productId}`를 부르고, `getProductSummary`는 그 결과에서 이름과 첫 사진만
남깁니다(#413). 따로 부르면 같은 엔드포인트를 두 벌로 다루게 됩니다.

**캐시는 한 자리가 아닙니다.** 상세는 서버 컴포넌트가 받아 화면으로 내리므로 TanStack Query 캐시에 들어가지
않고, `useQueryProductSummary`가 담는 것은 축약본입니다. 담는 모양이 다르므로 키도 `product.summary`로
나눠 뒀습니다 — 한 키에 두 모양을 얹으면 나중에 같은 키로 상세를 담을 때 어긋납니다.

**`cautions`를 떨어뜨리지 않고 담아 둡니다.** 지금 화면에 그릴 자리가 없지만 경고로 쓰기로 되어 있는 값이라
(#414) 여기서 버리면 그 작업이 이 레이어부터 다시 열어야 합니다. 다만 **오는 것은 표시명 배열뿐입니다** —
서버가 `CautionIngredientCode.getDisplayName()`을 거쳐 내보내고, 위험 등급(`CautionLevel`)은 응답에 없습니다.
독성과 섭취 주의를 가르려면 백엔드가 응답을 넓혀야 합니다.

**null 여부는 OpenAPI가 아니라 백엔드 엔티티에서 읽었습니다.** 명세에 `required`가 하나도 없어 스키마로는
구분할 수 없습니다. `Product` 엔티티에서 `@Column(nullable = false)`가 붙지 않은 열(정가·별점·제조사·제조국·
급여 대상·급여 방법·소비기한·개봉 후 일수·보관 방법)이 타입에서 `| null`입니다. 실제 응답으로는 아직 확인하지
못했습니다.

**할인율은 서버 `discountRate`를 그대로 씁니다.** 정가(`originalPrice`)도 상세 응답에는 있습니다 — 목록·검색
카드(`ProductCard`)는 여전히 정가가 없어 두 금액에서 할인율을 계산하므로, 같은 상품이 목록과 상세에서 다른
%로 보일 수 있습니다. 실데이터로 확인이 필요한 항목입니다.

**`use-product-list.ts`는 TanStack Query로 감싸지 않았습니다.** 상품 목록은 공개 데이터라 서버 컴포넌트가
첫 페이지를 직접 fetch하고, "더 보기"는 캐싱·무효화가 필요 없는 단순 이어 붙이기라 Query 캐시를 쓸 이유가
없어서입니다(#289). Query가 필요해지는 지점(찜 여부처럼 사용자별로 갈리는 값 등)이 생기면 그때 다시 봅니다.

상품 카드는 두지 않는다. 화면마다 보여주는 항목이 아홉 가지로 갈려, 조각(`shared/ui`의 `Price`·`ProductSummary`)을 화면에서 조립한다. 근거는 [component-convention](../../../docs/conventions/component-convention.md)의 "공용으로 올리는 기준"을 본다.

**점수가 없는 것은 0점이 아니다.** 영양 정보가 등록되지 않아 계산하지 못한 상품에는 `score={null}`을 준다. 0으로 내려보내면 "확인이 필요해요"로 읽혀 궁합이 나쁜 상품처럼 보인다 — 재 봤더니 안 맞는 것과 아직 재지 않은 것은 다른 이야기다. 판정이 아니라 모른다는 뜻이라 채우지 않고 테두리만 둔다.

**`compare-slot.tsx`의 간격은 임의로 고르지 않았다.** 채워진 자리는 이미지·이름/가격을 12px 바깥·4px 안쪽 두 겹으로 묶고, 빈 자리는 8px 한 겹으로 묶는다(시안 1568-70143·1117-6319). 서로 다른 간격처럼 보이지만, 한쪽만 채워졌을 때 두 "장바구니 추가"/"상품 추가하기" 버튼이 같은 줄에 나란히 놓이도록 시안이 정확히 맞춰 둔 값이라 통일하면 오히려 어긋난다.
