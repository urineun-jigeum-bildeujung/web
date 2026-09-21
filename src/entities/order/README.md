# entities/order

주문을 표현하는 것들.

| 파일 | 설명 |
| --- | --- |
| `api/orders.ts` | 주문 API. 목록 조회·구매 확정·주문 취소 |
| `api/use-query-orders.ts` | 주문 목록 조회 훅 |
| `api/use-mutate-order.ts` | 구매 확정·주문 취소 훅. 끝나면 목록을 다시 받는다 |
| `model/order-status.ts` | 서버 상태 문자열을 화면 상태로. 아는 값만 통과시킨다 |
| `ui/order-status-badge.tsx` | 주문 상태 뱃지. 결제완료·상품준비·배송중·배송완료·구매확정 |
| `ui/order-product-row.tsx` | 주문 상품 한 줄. 썸네일 96 + 이름·뱃지 / 옵션 / 결제 금액 |
| `ui/detail-section.tsx` | 제목을 안에 둔 내역 구역. 카드 여부는 쓰는 쪽이 정한다 |
| `ui/detail-row.tsx` | 이름·값 한 줄. 값을 오른쪽 끝에 붙이거나 아래로 내린다 |
| `ui/payment-detail.tsx` | 결제 내역 줄들. 결제금액·상품 옵션·배송비·결제수단 |
| `ui/delivery-detail.tsx` | 배송지 줄들. 받는 사람·연락처·주소·요청사항 |
| `index.ts` | 공개 API |

상태 값은 IA의 "주문/배송 내역" 단위기능을 따른다.

**다섯 상태가 모두 같은 색이다.** UI 시안(mypa_061)이 그렇게 정했다. 어느 단계인지는
색이 아니라 문구가 알리므로 문구를 지우거나 아이콘으로 대체하지 않는다.

`payment-detail`·`delivery-detail`은 주문 상세(`mypa_161`)와 주문 완료(`paym_002`)가 **타이포·간격까지 같은 블록**을 쓰기 때문에 올라왔다 (#210). 주문 상세는 흰 카드 안에, 주문 완료는 흰 바닥에 그대로 놓이므로 **카드 껍데기는 `DetailSection`이 갖지 않고 쓰는 쪽이 `className`으로 얹는다.**

`order-product-row`는 주문 목록(`views/orders`)과 주문 상세(`views/order-detail`)가 함께 쓴다. `views` 안에 두면 같은 레이어끼리 참조하게 되어 ESLint가 막으므로 여기 있다 (#205).

## 서버 상태를 다 알지 못한다

백엔드 `API 명세`에서 확인한 주문 상태는 **셋뿐**이다 — 목록·상세 Example의 `PAID`·`DELIVERED`와
구매 확정이 만든다고 적힌 `CONFIRMED`. 화면이 쓰는 다섯 중 **배송준비중·배송중에 해당하는 값과
취소 상태는 명세 어디에도 없다.** 취소는 "취소 완료로 전환"이라고 한국어로만 적혀 있다.

그래서 `model/order-status.ts`는 **아는 값만 통과시키고 나머지는 `null`을 돌려준다.** `PREPARING`
같은 이름을 넣어 두면 맞을 때는 조용히 지나가고 틀리면 그 주문만 엉뚱한 단계로 보인다. 모르는
값이 오면 화면은 뱃지와 행동 버튼을 감추고 "자세히 보기"만 남긴다.

**백엔드에 상태 값 목록을 물어야 한다.** 답이 오면 `SERVER_TO_VIEW`만 채우면 된다 (#284).

## 아직 없는 것

주문 상세 조회(`GET /orders/{orderId}`)와 반품·교환 신청(`POST /orders/{orderId}/claims`).
명세상 둘 다 완료라 바로 붙일 수 있다.
