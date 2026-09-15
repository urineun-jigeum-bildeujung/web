# views/edit-address

배송지 추가·수정 화면. UI 시안 `mypa_311_미입력`, `mypa_311`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/edit-address-view.tsx` | 배송지 추가·수정 |
| `ui/edit-address-view.test.tsx` | 주소창이 가리키는 값이 채워지는지, 고른 주소가 들어오는지 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/address/new` — `src/app/mypage/address/new/page.tsx`

## 주소는 어디서 오는가

이 화면에서 직접 적지 않는다. `받을 곳 주소` 줄은 입력칸이 아니라 `/mypage/address/search`로 가는 링크이고, 검색 화면이 고른 주소를 `?roadAddr=`에 실어 돌려보낸다.

컴포넌트 상태로 들지 않은 이유는 검색 화면으로 넘어가는 순간 사라지기 때문이다. URL에 두면 새로고침과 뒤로가기에서도 살아남는다 (AGENTS.md 5.1).

## 아직 없는 것

API 연동. 화면 안의 값은 확인용 목 데이터다.

백엔드가 `Address` 엔티티에 `receiverPhone`·`zipCode` 컬럼을 추가하고 `deliveryNode`를 `deliveryNote`로 고치기로 했다(2026-09-15 회신). 저장할 때 `zipNo → zipCode`, `roadAddr → address`로 매핑해 보낸다.
