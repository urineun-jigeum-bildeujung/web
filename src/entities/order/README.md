# entities/order

주문을 표현하는 것들.

| 파일 | 설명 |
| --- | --- |
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

조회 훅(`api/`)과 주문 타입(`model/`)은 백엔드 API 계약이 정해진 뒤에 만든다.
