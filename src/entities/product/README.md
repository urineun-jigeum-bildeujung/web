# entities/product

상품을 표현하는 것들. 백엔드 도메인의 상품에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/match-score-badge.tsx` | 적합도 점수 배지. 점수와 함께 구간 문구를 읽힌다 |
| `index.ts` | 공개 API |

## 아직 없는 것

타입(`model/`)과 조회 훅(`api/`)은 백엔드 API 계약이 정해진 뒤에 만든다.

상품 카드는 두지 않는다. 화면마다 보여주는 항목이 아홉 가지로 갈려, 조각(`shared/ui`의 `Price`·`ProductSummary`)을 화면에서 조립한다. 근거는 [component-convention](../../../docs/conventions/component-convention.md)의 "공용으로 올리는 기준"을 본다.
