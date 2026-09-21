# views/orders

주문·배송 확인 화면. UI 시안 `mypa_061 계열`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/orders-view.tsx` | 주문·배송 확인 |
| `ui/orders-skeleton.tsx` | 불러오는 동안의 뼈대 |
| `ui/delivery-tracking-dialog.tsx` | 배송 조회 준비중 안내 |
| `index.ts` | 공개 API |

주문 상품 줄은 상세 화면도 써서 `entities/order`로 옮겼다 (#205).

## 라우트

`/mypage/orders` — `src/app/mypage/orders/page.tsx`

## API

`GET /orders`로 받는다. 커서 페이지네이션(`size`·`cursor` → `nextCursor`·`hasNext`)인데
**지금은 첫 쪽만 부른다.** 명세 Example이 한 쪽짜리뿐이라 이어 부르는 동작을 확인하지 못했다.

구매 확정·주문 취소는 `204 No Content`라 바뀐 주문을 응답으로 받지 못한다. 끝난 뒤 목록을
다시 조회해 맞춘다. **낙관적으로 먼저 그리지 않는다** — 되돌릴 수 없는 동작이라 서버가 거절하면
확정된 줄 알았던 주문이 되살아난다 (#284).

## 아직 없는 것

**상품 옵션.** 시안의 둘째 줄은 "상품 옵션" 자리인데 목록 응답 `items[]`에 옵션이 없다.
지금은 몇 개를 샀는지로 채우고 백엔드에 확인을 요청해 뒀다 (#284).

**다섯 상태를 모두 옮긴다.** 2026-09-21에 백엔드 `OrderStatus` enum에서 값을 확인해
`PREPARING`·`SHIPPING`까지 채웠다 (#288). 취소·환불된 주문은 시안에 뱃지가 없어 그대로 두었고,
그런 값이 오면 뱃지와 행동 버튼 없이 "자세히 보기"만 뜬다. 자세한 것은
[entities/order](../../entities/order/README.md)를 본다.

**배송 조회.** 시안은 `배송 위치 보기`를 활성으로 그렸지만 택배사 연동이 정해지지 않아
준비중 안내만 띄운다. 갈 곳이 생기면 `delivery-tracking-dialog.tsx`를 걷어내고 그 자리를 잇는다 (#201).
