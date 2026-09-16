# views/orders

주문·배송 확인 화면. UI 시안 `mypa_061 계열`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/orders-view.tsx` | 주문·배송 확인 |
| `ui/delivery-tracking-dialog.tsx` | 배송 조회 준비중 안내 |
| `index.ts` | 공개 API |

주문 상품 줄은 상세 화면도 써서 `entities/order`로 옮겼다 (#205).

## 라우트

`/mypage/orders` — `src/app/mypage/orders/page.tsx`

## 아직 없는 것

API 연동. 화면 안의 값은 확인용 목 데이터이며 백엔드 계약이 정해지면 교체한다.

**배송 조회.** 시안은 `배송 위치 보기`를 활성으로 그렸지만 택배사 연동이 정해지지 않아
준비중 안내만 띄운다. 갈 곳이 생기면 `delivery-tracking-dialog.tsx`를 걷어내고 그 자리를 잇는다 (#201).
