# addresses

등록된 배송지를 보고 골라 고치는 화면.

- **라우트**: `/mypage/address` — `src/app/mypage/address/page.tsx`
- **조립**: `entities/address`의 `AddressPlaceList` · `AddPlaceLink`, `shared/ui/page-header`
- **상태**: 배송지 목록 서버 상태 (`useQueryAddresses`)

| 파일 | 설명 |
| --- | --- |
| `ui/addresses-view.tsx` | 머리말과 목록 자리 잡기 |
| `ui/addresses-view.test.tsx` | 실제 목록을 그리는지, 자리 표시 문구가 남지 않았는지 |
| `index.ts` | 공개 API |

## 목록은 여기 없다

**결제의 배송지 설정(`paym_011`)과 같은 것을 그린다.** 줄 모양·묶는 차례·빈 상태·실패 표시가 전부 같아 [entities/address](../../entities/address/README.md)로 내렸다. 이 화면이 맡는 것은 머리말뿐이다 (#329).

## 시안이 없다

2026-09-18 PD팀 답이 **"작업 예정"**이었다. 그전까지 이 화면은 "디자인 확정 전 자리 표시 화면입니다"라는 개발용 문구를 보여 주고 있었다. 같은 데이터를 그리는 `paym_011`이 확정돼 있어 그 목록을 그대로 쓰기로 했다 — 시안이 와도 벌어질 거리가 작다.

## 아직 없는 것

- **지우기.** `DELETE /members/me/addresses/{id}`가 열려 있고 `deleteAddress`도 있지만 부르는 곳이 없다. 되돌릴 수 없는 동작이라 확인창 문구와 자리가 시안에 있어야 한다
- **기본 배송지 바꾸기.** 수정 화면(`/mypage/address/new?place=`)에서 한다. 목록에서 바로 바꾸는 자리는 시안에 없다
