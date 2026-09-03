# entities/product

상품을 표현하는 것들. 백엔드 도메인의 상품에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/match-score-badge.tsx` | 적합도 점수 배지. 점수와 함께 구간 문구를 읽힌다 |
| `ui/compare-table.tsx` | 두 상품의 스펙을 항목별로 견주는 표 (`comp_001`) |
| `ui/compare-slot.tsx` | 비교할 자리 하나. 비어 있으면 담으라고 안내한다 (`comp_001`, `comp_001_empty`) |
| `ui/product-option-sheet.tsx` | 목록에서 바로 구성과 수량을 골라 담는 바텀시트 (타임딜_옵션 선택 바텀시트) |
| `index.ts` | 공개 API |

## 아직 없는 것

타입(`model/`)과 조회 훅(`api/`)은 백엔드 API 계약이 정해진 뒤에 만든다.

상품 카드는 두지 않는다. 화면마다 보여주는 항목이 아홉 가지로 갈려, 조각(`shared/ui`의 `Price`·`ProductSummary`)을 화면에서 조립한다. 근거는 [component-convention](../../../docs/conventions/component-convention.md)의 "공용으로 올리는 기준"을 본다.
