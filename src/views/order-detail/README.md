# views/order-detail

주문 하나의 내역을 자세히 보여주는 화면. 와이어프레임 `mypa_161`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/order-detail-view.tsx` | 주문정보·결제상세·배송지 정보 세 카드를 조립한다 |
| `ui/detail-card.tsx` | 제목을 안에 둔 카드. 지금은 이 화면만 써서 여기 둔다 |
| `ui/order-detail-view.test.tsx` | 카드 구성과 주문별 내용이 갈리는지 본다 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/orders/[id]` — `src/app/mypage/orders/[id]/page.tsx`

**경로는 임시다.** 주문·배송 화면의 "자세히 보기"가 여기로 온다.

## DetailCard를 공용으로 올리지 않은 이유

마이페이지의 `SettingGroup`과 비슷하지만 제목 위치가 다르다. `SettingGroup`은 제목이 카드 밖 위에 작은 회색으로 붙고, 여기는 카드 안에 굵게 들어간다.

한 화면에서만 쓰므로 화면 폴더에 둔다. 결제 화면(`paym_001`)에 같은 모양이 나오면 그때 올린다.

## 아직 없는 것

값이 모두 목 데이터다. 주문 ID로 조회하는 훅은 API 계약이 정해진 뒤에 붙인다.
