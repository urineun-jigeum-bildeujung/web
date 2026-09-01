# views/payment-methods

간편결제 카드 관리 화면. 와이어프레임 `mypa_051 계열`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/payment-methods-view.tsx` | 간편결제 카드 관리 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/payment` — `src/app/mypage/payment/page.tsx`

카드 등록을 자체 화면으로 제공할지 토스 결제위젯에 맡길지는 PM·PD 확인이 필요하다.

## 아직 없는 것

API 연동. 화면 안의 값은 확인용 목 데이터이며 백엔드 계약이 정해지면 교체한다.
