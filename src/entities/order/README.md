# entities/order

주문을 표현하는 것들.

| 파일 | 설명 |
| --- | --- |
| `api/orders.ts` | 주문 API. 목록·상세 조회와 구매 확정·주문 취소 |
| `api/use-query-orders.ts` | 주문 목록 조회 훅 |
| `api/use-query-order-detail.ts` | 주문 상세 조회 훅. 숫자가 아닌 주소면 서버를 부르지 않는다 |
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

## 서버 상태는 아홉, 화면이 그리는 것은 다섯

2026-09-21에 백엔드 저장소의 `order-service/domain/order/OrderStatus.java`에서 값을 확인했다.
명세 Example에는 `PAID`·`DELIVERED`·`CONFIRMED` 셋만 나와 있어 그때까지 셋만 통과시켰다 (#284).

| 서버 값 | `displayName` | 화면 |
| --- | --- | --- |
| `PENDING` | 결제대기 | — |
| `PAID` | 결제완료 | `paid` |
| `PREPARING` | 상품준비 | `preparing` |
| `SHIPPING` | 배송중 | `shipping` |
| `DELIVERED` | 배송완료 | `delivered` |
| `CONFIRMED` | 구매확정 | `confirmed` |
| `CANCELLED` · `PARTIAL_REFUND` · `REFUNDED` | 취소 · 부분환불 · 환불완료 | — |

**남은 넷은 옮기지 않는다.** 시안(mypa_061)에 그 뱃지가 없다. 결제 전 주문은 목록에 설 일이 없고,
취소·환불된 주문을 어떻게 보여줄지는 PD 확인 대상이다. `toOrderStatus`가 `null`을 돌리면 화면은
뱃지와 행동 버튼을 감추고 "자세히 보기"만 남긴다.

**뱃지 문구가 시안과 기능명세서에서 갈린다.** 시안은 `배송준비중`인데 기능명세서와 백엔드
`displayName`은 `상품준비`다. 화면에 나가는 글자는 시안을 따랐고 PD에 확인을 요청해 뒀다 (#288).

상태 전이 규칙도 enum에 있다 — `PAID`·`PREPARING`에서만 취소되고 `SHIPPING`은 `DELIVERED`로만
간다. 목록 화면이 취소 버튼을 띄우는 조건과 같다.

주문 상세 응답에는 상품마다 `itemStatus`(`PAID`·`CANCELLED`·`PARTIAL_RETURN`·`RETURNED`)가 따로
온다. 한 상품만 반품 중인 주문을 그리려면 이것이 필요한데 그 화면이 아직 없어 쓰지 않는다.

## 아직 없는 것

반품·교환 신청(`POST /orders/{orderId}/claims`). 명세상 완료지만 신청 화면 시안이 없어 부를 자리가
없다. 자세한 것은 [views/order-detail](../../views/order-detail/README.md)을 본다.
