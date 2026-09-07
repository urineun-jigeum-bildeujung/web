# entities/product

상품을 표현하는 것들. 백엔드 도메인의 상품에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/match-score-badge.tsx` | 적합도 점수 배지. 점수와 함께 구간 문구를 읽히고, 재지 못했으면 "정보 확인 중" |
| `ui/compare-table.tsx` | 두 상품의 스펙을 항목별로 견주는 표 (`comp_001`) |
| `ui/compare-slot.tsx` | 비교할 자리 하나. 비어 있으면 담으라고 안내한다 (`comp_001`, `comp_001_empty`) |
| `ui/product-option-sheet.tsx` | 목록에서 바로 구성과 수량을 골라 담는 바텀시트 (타임딜_옵션 선택 바텀시트) |
| `index.ts` | 공개 API |

## 아직 없는 것

타입(`model/`)과 조회 훅(`api/`)은 백엔드 API 계약이 정해진 뒤에 만든다.

상품 카드는 두지 않는다. 화면마다 보여주는 항목이 아홉 가지로 갈려, 조각(`shared/ui`의 `Price`·`ProductSummary`)을 화면에서 조립한다. 근거는 [component-convention](../../../docs/conventions/component-convention.md)의 "공용으로 올리는 기준"을 본다.

**점수가 없는 것은 0점이 아니다.** 영양 정보가 등록되지 않아 계산하지 못한 상품에는 `score={null}`을 준다. 0으로 내려보내면 "확인이 필요해요"로 읽혀 궁합이 나쁜 상품처럼 보인다 — 재 봤더니 안 맞는 것과 아직 재지 않은 것은 다른 이야기다. 판정이 아니라 모른다는 뜻이라 채우지 않고 테두리만 둔다.
